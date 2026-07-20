import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AppThrottlerGuard } from './common/app-throttler.guard';
import { UsersModule } from './users/users.module';
import { DecksModule } from './decks/decks.module';
import { CardsModule } from './cards/cards.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TranslationModule } from './translation/translation.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'audio'),
      serveRoot: '/audio',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DecksModule,
    CardsModule,
    ReviewsModule,
    TranslationModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // JwtAuthGuard doit s'exécuter avant ThrottlerGuard : il peuple req.user,
    // nécessaire pour que les throttles par utilisateur (routes IA) fonctionnent.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
  ],
})
export class AppModule {}
