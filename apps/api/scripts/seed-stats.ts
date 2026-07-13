/**
 * Script ponctuel pour peupler un deck de test avec des reviews étalées sur
 * plusieurs semaines, afin de tester manuellement /stats/overview,
 * /stats/history et /stats/progress-highlight sans attendre des vraies
 * semaines d'usage. Ne fait pas partie du cycle de vie normal de l'app.
 *
 * Usage : npx ts-node -r tsconfig-paths/register scripts/seed-stats.ts
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

// Ratings fixes (pas de hasard) pour que le résultat du script soit prévisible
// et donc facile à vérifier via les endpoints stats.
const HISTORY_RATINGS: Record<number, number> = {
  1: 3,
  3: 1,
  4: 3,
  6: 3,
  7: 1,
  8: 3,
  10: 3,
  12: 1,
  13: 3,
  14: 3,
  16: 1,
  18: 3,
  19: 3,
  20: 1,
  22: 3,
  24: 3,
  // 25/27/28/29 volontairement toutes en succès : évite de créer un candidat
  // progress-highlight parasite sur strugglingCard (voir plus bas).
  25: 3,
  27: 3,
  28: 3,
  29: 3,
};

interface SeedLog {
  cardId: string;
  rating: number;
  reviewedAt: Date;
  scheduledDays: number;
  elapsedDays: number;
  userAnswer?: string;
  aiVerdict?: string;
}

async function main() {
  const email = 'statsseed@example.com';
  const password = await bcrypt.hash('supersecret123', 10);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, password } });
  }

  // Idempotent : on repart d'un deck propre à chaque exécution.
  await prisma.deck.deleteMany({ where: { userId: user.id, name: 'Stats Seed Deck' } });
  const deck = await prisma.deck.create({ data: { name: 'Stats Seed Deck', userId: user.id } });

  const masteredCard = await prisma.card.create({
    data: {
      deckId: deck.id,
      type: CardType.CLASSIC,
      front: 'Seed: mastered word',
      back: 'Mot maîtrisé',
      state: 2,
      stability: 45,
      difficulty: 3,
      reps: 8,
      lapses: 0,
      due: daysAgo(-10),
    },
  });

  const strugglingCard = await prisma.card.create({
    data: {
      deckId: deck.id,
      type: CardType.CLASSIC,
      front: 'Seed: struggling word',
      back: 'Mot difficile',
      state: 2,
      stability: 5,
      difficulty: 7,
      reps: 5,
      lapses: 2,
      due: daysAgo(-2),
    },
  });

  const progressCardA = await prisma.card.create({
    data: {
      deckId: deck.id,
      type: CardType.OPEN_QUESTION,
      front: 'Seed: progress question A',
      back: 'Réponse de référence A',
      state: 2,
      stability: 12,
      difficulty: 5,
      reps: 6,
      lapses: 1,
      due: daysAgo(-5),
    },
  });

  const progressCardB = await prisma.card.create({
    data: {
      deckId: deck.id,
      type: CardType.CLASSIC,
      front: 'Seed: progress word B',
      back: 'Mot B',
      state: 2,
      stability: 10,
      difficulty: 5,
      reps: 4,
      lapses: 1,
      due: daysAgo(-3),
    },
  });

  await prisma.card.create({
    data: {
      deckId: deck.id,
      type: CardType.CLASSIC,
      front: 'Seed: brand new word',
      back: 'Mot nouveau',
      state: 0,
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      due: daysAgo(-1),
    },
  });

  await prisma.card.create({
    data: {
      deckId: deck.id,
      type: CardType.CLASSIC,
      front: 'Seed: learning word',
      back: 'Mot en apprentissage',
      state: 1,
      stability: 0.5,
      difficulty: 6,
      reps: 1,
      lapses: 0,
      due: daysAgo(-1),
    },
  });

  const logs: SeedLog[] = [];

  // Streak : au moins une review chaque jour sur les 6 derniers jours.
  for (let i = 0; i < 6; i++) {
    logs.push({ cardId: masteredCard.id, rating: 3, reviewedAt: daysAgo(i), scheduledDays: 5, elapsedDays: 1 });
  }

  // Historique 30 jours avec des trous et un mélange succès/échec.
  for (const [dayOffsetStr, rating] of Object.entries(HISTORY_RATINGS)) {
    const dayOffset = Number(dayOffsetStr);
    logs.push({
      cardId: strugglingCard.id,
      rating,
      reviewedAt: daysAgo(dayOffset),
      scheduledDays: rating >= 3 ? 3 : 1,
      elapsedDays: 2,
    });
  }

  // Progress highlight, candidat A : lapse à J-30 (dans la fenêtre 25-35),
  // puis plusieurs reviews réussies depuis (la plus récente à J-2).
  logs.push({
    cardId: progressCardA.id,
    rating: 1,
    userAnswer: 'Mauvaise réponse initiale',
    aiVerdict: 'incompris',
    reviewedAt: daysAgo(30),
    scheduledDays: 1,
    elapsedDays: 5,
  });
  logs.push({
    cardId: progressCardA.id,
    rating: 2,
    userAnswer: 'Réponse partielle',
    aiVerdict: 'partiellement',
    reviewedAt: daysAgo(20),
    scheduledDays: 2,
    elapsedDays: 10,
  });
  logs.push({
    cardId: progressCardA.id,
    rating: 3,
    userAnswer: 'Bonne réponse',
    aiVerdict: 'compris',
    reviewedAt: daysAgo(10),
    scheduledDays: 6,
    elapsedDays: 10,
  });
  logs.push({
    cardId: progressCardA.id,
    rating: 4,
    userAnswer: 'Excellente réponse détaillée',
    aiVerdict: 'compris',
    reviewedAt: daysAgo(2),
    scheduledDays: 12,
    elapsedDays: 8,
  });

  // Progress highlight, candidat B : lapse à J-28, une seule review réussie
  // depuis -> moins de reviews "entre les deux" que A, donc A doit gagner.
  logs.push({ cardId: progressCardB.id, rating: 1, reviewedAt: daysAgo(28), scheduledDays: 1, elapsedDays: 3 });
  logs.push({ cardId: progressCardB.id, rating: 3, reviewedAt: daysAgo(4), scheduledDays: 5, elapsedDays: 24 });

  await prisma.reviewLog.createMany({ data: logs });

  console.log('Seed terminé.');
  console.log('  email    :', email);
  console.log('  password : supersecret123');
  console.log('  deckId   :', deck.id);
  console.log('  logs     :', logs.length);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
