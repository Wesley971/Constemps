import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Cette adresse e-mail est déjà utilisée');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashedPassword },
      select: { id: true, email: true },
    });

    return { user, token: this.signToken(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const publicUser = { id: user.id, email: user.email };
    return { user: publicUser, token: this.signToken(publicUser) };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const wantsEmailChange = dto.email !== undefined;
    const wantsPasswordChange =
      dto.currentPassword !== undefined || dto.newPassword !== undefined;

    if (!wantsEmailChange && !wantsPasswordChange) {
      throw new BadRequestException('Aucune modification fournie');
    }

    if (wantsPasswordChange && (!dto.currentPassword || !dto.newPassword)) {
      throw new BadRequestException(
        'Le mot de passe actuel et le nouveau mot de passe sont tous les deux requis pour changer de mot de passe',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const data: { email?: string; password?: string } = {};

    if (wantsEmailChange && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Cette adresse e-mail est déjà utilisée');
      }
      data.email = dto.email;
    }

    if (wantsPasswordChange) {
      const passwordMatches = await bcrypt.compare(
        dto.currentPassword!,
        user.password,
      );
      if (!passwordMatches) {
        throw new UnauthorizedException('Mot de passe actuel incorrect');
      }
      data.password = await bcrypt.hash(dto.newPassword!, BCRYPT_SALT_ROUNDS);
    }

    if (Object.keys(data).length === 0) {
      return { id: user.id, email: user.email };
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true },
    });
  }

  private signToken(user: { id: string; email: string }): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }
}
