import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'DATABASE_URL', 'GEMINI_API_KEY'];

function assertRequiredEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(
      `Variables d'environnement manquantes : ${missing.join(', ')}. Vérifie ton fichier .env.`,
    );
    process.exit(1);
  }
}

async function bootstrap() {
  assertRequiredEnvVars();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Un seul hop de proxy en prod (Caddy, voir docker-compose.prod.yml) : sans ça,
  // req.ip vaut l'IP interne Docker de Caddy pour tout le monde, et le throttle
  // anonyme (register/login) devient un budget partagé entre tous les clients
  // au lieu d'un budget par IP réelle.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
