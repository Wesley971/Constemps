import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const MAX_CONNECTION_ATTEMPTS = 5;
// Délai croissant entre chaque tentative : 2s, 4s, 6s, 8s (avant les
// tentatives 2 à 5), pour laisser le temps à MySQL (Docker) de finir son
// propre démarrage sans bombarder la connexion en boucle serrée.
const RETRY_DELAY_STEP_MS = 2000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    for (let attempt = 1; attempt <= MAX_CONNECTION_ATTEMPTS; attempt++) {
      console.log(
        `Tentative de connexion à la base ${attempt}/${MAX_CONNECTION_ATTEMPTS}...`,
      );
      try {
        await this.$connect();
        if (attempt > 1) {
          console.log(`Connexion à la base réussie (tentative ${attempt}).`);
        }
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (attempt === MAX_CONNECTION_ATTEMPTS) {
          console.error(
            `Échec de connexion à la base après ${MAX_CONNECTION_ATTEMPTS} tentatives : ${message}`,
          );
          console.error(
            "Arrêt de l'API. Vérifie que MySQL (Docker) est démarré et accessible, puis relance.",
          );
          process.exit(1);
        }
        console.error(
          `Échec de la tentative ${attempt}/${MAX_CONNECTION_ATTEMPTS} : ${message}`,
        );
        await wait(attempt * RETRY_DELAY_STEP_MS);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
