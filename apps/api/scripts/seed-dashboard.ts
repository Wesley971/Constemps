/**
 * Script ponctuel pour peupler un compte de test avec une activité cumulée
 * étalée sur plusieurs semaines (jours non nécessairement consécutifs), afin
 * de tester manuellement le dashboard (/dashboard, /dashboard/activity) :
 * message narratif, jalons surprise (7/30/66 jours cumulés), heatmap de
 * régularité. Ne fait pas partie du cycle de vie normal de l'app, mais reste
 * dans le repo comme seed-stats.ts pour pouvoir retester facilement.
 *
 * Usage : npx ts-node -r tsconfig-paths/register scripts/seed-dashboard.ts
 */
import 'dotenv/config';
import { PrismaClient, CardType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function daysAgo(n: number, hour = 12): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

// 30 jours d'activité cumulée, répartis sur les 40 derniers jours avec des
// trous volontaires : prouve que la régularité cumulée n'exige pas de
// consécutivité, et fait passer le compte le seuil de jalon 7 ET 30 (mais
// pas 66) au premier chargement du dashboard.
const ACTIVE_DAY_OFFSETS = [
  0, 1, 2, 4, 5, 7, 8, 9, 10, 12, 13, 15, 16, 17, 19, 20, 22, 23, 24, 26, 27,
  28, 30, 31, 33, 34, 35, 37, 38, 39,
];

const RESUME_COURTS = [
  'diffusion de Rayleigh',
  'accord du participe passé',
  'théorème de Pythagore',
];

interface SeedLog {
  cardId: string;
  rating: number;
  reviewedAt: Date;
  scheduledDays: number;
  elapsedDays: number;
  userAnswer?: string;
  aiVerdict?: string;
  resumeCourt?: string;
}

async function main() {
  const email = 'dashboardseed@example.com';
  const password = await bcrypt.hash('supersecret123', 10);

  // Antériorité au-delà du plus vieux jour d'activité seedé (offset 39,
  // ci-dessous) : sans ça, un compte créé "maintenant" mais avec un
  // historique de reviews vieux de 40 jours produirait un message narratif
  // incohérent ("ton tout premier jour" alors qu'il y a déjà un mois d'activité).
  const accountCreatedAt = daysAgo(45);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, password, createdAt: accountCreatedAt },
    });
  }

  // Idempotent : repart d'un état propre à chaque exécution (decks, jalons
  // déjà enregistrés, cache du message narratif, ancienneté du compte).
  await prisma.deck.deleteMany({ where: { userId: user.id } });
  await prisma.accountMilestone.deleteMany({ where: { userId: user.id } });
  await prisma.user.update({
    where: { id: user.id },
    data: {
      createdAt: accountCreatedAt,
      dashboardMessage: null,
      dashboardMessageAt: null,
      dashboardMessageReviewCount: null,
    },
  });

  const deck = await prisma.deck.create({
    data: { name: 'Dashboard Seed Deck', userId: user.id },
  });

  const classicCard = await prisma.card.create({
    data: {
      deckId: deck.id,
      type: CardType.CLASSIC,
      front: 'Seed: dashboard word',
      back: 'Mot du dashboard',
      state: 2,
      stability: 15,
      difficulty: 4,
      reps: ACTIVE_DAY_OFFSETS.length,
      lapses: 6,
      due: daysAgo(-1),
    },
  });

  const openCard = await prisma.card.create({
    data: {
      deckId: deck.id,
      type: CardType.OPEN_QUESTION,
      front: 'Seed: dashboard question',
      back: 'Réponse de référence dashboard',
      state: 2,
      stability: 10,
      difficulty: 5,
      reps: 3,
      lapses: 0,
      due: daysAgo(-1),
    },
  });

  const logs: SeedLog[] = ACTIVE_DAY_OFFSETS.map((offset, i) => ({
    cardId: classicCard.id,
    // Majoritairement réussi, quelques échecs mêlés (un cinquième des jours).
    rating: i % 5 === 0 ? 1 : 3,
    reviewedAt: daysAgo(offset),
    scheduledDays: 3,
    elapsedDays: 2,
  }));

  // Quelques OPEN_QUESTION récentes avec resumeCourt, pour alimenter le
  // contexte du message narratif ("sujets récemment travaillés").
  RESUME_COURTS.forEach((resumeCourt, i) => {
    logs.push({
      cardId: openCard.id,
      rating: 3,
      reviewedAt: daysAgo(i),
      scheduledDays: 4,
      elapsedDays: 3,
      userAnswer: `Réponse seed ${i}`,
      aiVerdict: 'compris',
      resumeCourt,
    });
  });

  await prisma.reviewLog.createMany({ data: logs });

  console.log('Seed dashboard terminé.');
  console.log('  email                :', email);
  console.log('  password             : supersecret123');
  console.log('  deckId               :', deck.id);
  console.log('  jours cumulés actifs :', ACTIVE_DAY_OFFSETS.length);
  console.log('  logs                 :', logs.length);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
