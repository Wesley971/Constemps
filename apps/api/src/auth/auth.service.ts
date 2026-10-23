import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { hashToken } from './token-hash';

const BCRYPT_SALT_ROUNDS = 10;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Champs du profil renvoyés au front (CON-71), mêmes pour GET /auth/me et
// PATCH /auth/profile : un retour plus maigre après une modification ferait
// perdre à l'écran l'ancienneté et la langue apprise. Jamais le mot de passe.
const PROFILE_SELECT = {
  id: true,
  email: true,
  createdAt: true,
  learningLanguage: true,
} satisfies Prisma.UserSelect;

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

type Db = PrismaService | Prisma.TransactionClient;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

    // user.create() et la création du refresh token doivent réussir ou
    // échouer ensemble : sans ça, un échec du second write (DB coupée, pool
    // épuisé) laisserait un compte créé sans aucun token, avec l'email
    // définitivement "pris" pour l'utilisateur sans qu'il ait pu se
    // connecter — ni vérification email ni mot de passe oublié en v0 pour
    // s'en sortir.
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: dto.email, password: hashedPassword },
        select: { id: true, email: true },
      });

      return { user, ...(await this.issueTokens(user.id, tx)) };
    });
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
    return { user: publicUser, ...(await this.issueTokens(user.id)) };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    currentRawRefreshToken: string | null,
  ) {
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

    // La révocation des autres sessions ci-dessous a besoin d'identifier la
    // session courante pour l'exclure. Aucun chemin applicatif ne peut émettre
    // un access token sans refresh token associé (register/login/refresh
    // posent toujours les deux cookies ensemble) : si ce token est absent ici,
    // l'état est anormal, on refuse explicitement plutôt que de risquer une
    // déconnexion surprise de la session légitime en cours.
    if (wantsPasswordChange && !currentRawRefreshToken) {
      throw new UnauthorizedException(
        'Session invalide, reconnecte-toi avant de changer ton mot de passe',
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
      return this.getProfile(userId);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: PROFILE_SELECT,
    });

    if (wantsPasswordChange) {
      try {
        await this.revokeOtherSessions(userId, currentRawRefreshToken!);
      } catch (err) {
        // Best-effort, même principe que la révocation au logout : le mot de
        // passe a déjà été changé avec succès à cet instant, une panne sur la
        // révocation des autres sessions ne doit jamais transformer cette
        // réussite en une 500 trompeuse pour l'utilisateur.
        this.logger.error(
          'Échec de la révocation des autres sessions après changement de mot de passe',
          err,
        );
      }
    }

    return updated;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  // CON-64 : toutes les données liées (decks, cards, reviews, refresh tokens,
  // jalons) partent par les clés étrangères en ON DELETE CASCADE, en une seule
  // requête atomique côté MySQL.
  async deleteAccount(userId: string, dto: DeleteAccountDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    await this.prisma.user.delete({ where: { id: userId } });
  }

  private async issueTokens(
    userId: string,
    db: Db = this.prisma,
  ): Promise<IssuedTokens> {
    const refreshToken = await this.createRefreshTokenFamily(userId, db);
    return { accessToken: this.signAccessToken(userId), refreshToken };
  }

  private signAccessToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  private async createRefreshTokenFamily(
    userId: string,
    db: Db = this.prisma,
  ): Promise<string> {
    const rawToken = randomBytes(32).toString('hex');
    await db.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
    return rawToken;
  }

  // Rotation à chaque appel (CON-46) : l'ancien token est révoqué et un
  // nouveau est émis dans la même transaction. Sous MySQL InnoDB
  // (REPEATABLE READ par défaut), l'UPDATE conditionné sur revokedAt IS NULL
  // fait une lecture "current read" verrouillée : deux appels concurrents sur
  // le même token se sérialisent, le perdant échoue proprement sans déclencher
  // de révocation de famille (il voyait le token non-révoqué au démarrage de
  // sa propre transaction, ce n'est pas une réutilisation).
  async rotateRefreshToken(rawToken: string): Promise<IssuedTokens> {
    const tokenHash = hashToken(rawToken);
    const now = new Date();

    // Attention : une exception levée depuis le callback de $transaction fait
    // ROLLBACK toute la transaction, y compris la révocation de famille
    // ci-dessous. Le callback ne doit donc jamais throw : il retourne un
    // résultat discriminé, et c'est seulement après la transaction (donc une
    // fois les écritures validées) qu'on transforme un résultat en échec en
    // exception.
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (!existing) {
        return { ok: false as const };
      }

      if (existing.revokedAt) {
        // Réutilisation d'un token déjà tourné : vol probable, on coupe toute
        // la famille pour forcer une ré-authentification complète.
        await tx.refreshToken.updateMany({
          where: { familyId: existing.familyId, revokedAt: null },
          data: { revokedAt: now },
        });
        return { ok: false as const };
      }

      if (existing.expiresAt < now) {
        return { ok: false as const };
      }

      const revoked = await tx.refreshToken.updateMany({
        where: { id: existing.id, revokedAt: null },
        data: { revokedAt: now },
      });
      if (revoked.count === 0) {
        // Course perdue contre une rotation concurrente sur ce même token.
        return { ok: false as const };
      }

      const newRawToken = randomBytes(32).toString('hex');
      await tx.refreshToken.create({
        data: {
          userId: existing.userId,
          familyId: existing.familyId,
          tokenHash: hashToken(newRawToken),
          expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
        },
      });

      return {
        ok: true as const,
        accessToken: this.signAccessToken(existing.userId),
        refreshToken: newRawToken,
      };
    });

    if (!result.ok) {
      throw new UnauthorizedException();
    }
    return result;
  }

  // Logout : révoque uniquement le refresh token de cette session (pas toute
  // la famille), best-effort pour ne jamais empêcher le logout côté client.
  // Purge aussi les entrées déjà expirées : à ce volume d'usage, une ligne par
  // session suffit à borner la table sans job de nettoyage dédié.
  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  private async revokeOtherSessions(
    userId: string,
    currentRawRefreshToken: string,
  ): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
        tokenHash: { not: hashToken(currentRawRefreshToken) },
      },
      data: { revokedAt: new Date() },
    });
  }
}
