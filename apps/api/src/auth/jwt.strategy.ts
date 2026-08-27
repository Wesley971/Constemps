import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { hashToken } from './token-hash';

export interface JwtPayload {
  sub: string;
}

export function extractJwtFromCookie(req: Request): string | null {
  const cookies = req?.cookies as Record<string, string> | undefined;
  return cookies?.access_token ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: extractJwtFromCookie,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const rawToken = extractJwtFromCookie(req);
    if (rawToken) {
      const revoked = await this.prisma.revokedToken.findUnique({
        where: { tokenHash: hashToken(rawToken) },
      });
      if (revoked) {
        throw new UnauthorizedException();
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
