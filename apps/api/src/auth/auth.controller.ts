import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService, IssuedTokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from './current-user.decorator';
import {
  REFRESH_TOKEN_COOKIE,
  extractRefreshTokenFromCookie,
} from './refresh-token-cookie';

const ACCESS_TOKEN_COOKIE = 'access_token';
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60000 } };

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

// Le refresh token est scopé à /auth : il n'est utile qu'à /auth/refresh et
// /auth/logout, pas besoin de l'envoyer sur chaque requête API.
const refreshCookieOptions = { ...baseCookieOptions, path: '/auth' };

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, ...tokens } = await this.authService.register(dto);
    this.setAuthCookies(res, tokens);
    return user;
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, ...tokens } = await this.authService.login(dto);
    this.setAuthCookies(res, tokens);
    return user;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = extractRefreshTokenFromCookie(req);
    if (!rawRefreshToken) {
      throw new UnauthorizedException();
    }

    try {
      const tokens = await this.authService.rotateRefreshToken(rawRefreshToken);
      this.setAuthCookies(res, tokens);
      return { success: true };
    } catch (err) {
      this.clearAuthCookies(res);
      throw err;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = extractRefreshTokenFromCookie(req);
    if (rawRefreshToken) {
      try {
        await this.authService.revokeRefreshToken(rawRefreshToken);
      } catch (err) {
        // Best-effort : une panne d'invalidation serveur ne doit jamais
        // empêcher l'utilisateur de se déconnecter côté client.
        this.logger.error(
          'Échec de la révocation du refresh token au logout',
          err,
        );
      }
    }

    this.clearAuthCookies(res);
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    const currentRawRefreshToken = extractRefreshTokenFromCookie(req);
    return this.authService.updateProfile(user.id, dto, currentRawRefreshToken);
  }

  private setAuthCookies(res: Response, tokens: IssuedTokens) {
    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...baseCookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...refreshCookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
    res.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions);
  }
}
