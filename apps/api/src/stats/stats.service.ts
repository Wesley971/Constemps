import { Injectable, NotFoundException } from '@nestjs/common';
import { Rating } from 'ts-fsrs';
import type { Card, ReviewLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const HISTORY_WINDOW_DAYS = 30;
const RETENTION_WINDOW_DAYS = 30;

// Seuil arbitraire mais raisonnable : une carte dont la stability FSRS dépasse 21
// jours a une probabilité de rappel encore élevée trois semaines après sa dernière
// révision, ce qui correspond à une maîtrise durable plutôt qu'un apprentissage récent.
const MASTERED_STABILITY_THRESHOLD_DAYS = 21;

const PROGRESS_HIGHLIGHT_WINDOW_MIN_DAYS = 25;
const PROGRESS_HIGHLIGHT_WINDOW_MAX_DAYS = 35;

const STATE_NAMES = ['New', 'Learning', 'Review', 'Relearning'] as const;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertDeckOwnership(userId: string, deckId: string) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck || deck.userId !== userId) {
      throw new NotFoundException('Deck not found');
    }
    return deck;
  }

  private async computeCurrentStreak(deckId: string): Promise<number> {
    const logs = await this.prisma.reviewLog.findMany({
      where: { card: { deckId } },
      select: { reviewedAt: true },
    });

    const reviewDays = new Set(logs.map((log) => startOfDay(log.reviewedAt).getTime()));

    let cursor = startOfDay(new Date());
    if (!reviewDays.has(cursor.getTime())) {
      // Pas encore révisé aujourd'hui : la journée n'est pas terminée, donc le
      // streak n'est pas "cassé" pour autant. On commence à compter depuis hier.
      cursor = subDays(cursor, 1);
    }

    let streak = 0;
    while (reviewDays.has(cursor.getTime())) {
      streak += 1;
      cursor = subDays(cursor, 1);
    }

    return streak;
  }

  async getOverview(userId: string, deckId: string) {
    await this.assertDeckOwnership(userId, deckId);

    const [totalCards, groupedByState, masteredCards, recentLogs, currentStreak] = await Promise.all([
      this.prisma.card.count({ where: { deckId } }),
      this.prisma.card.groupBy({ by: ['state'], where: { deckId }, _count: { _all: true } }),
      this.prisma.card.count({
        where: { deckId, stability: { gt: MASTERED_STABILITY_THRESHOLD_DAYS } },
      }),
      this.prisma.reviewLog.findMany({
        where: { card: { deckId }, reviewedAt: { gte: subDays(new Date(), RETENTION_WINDOW_DAYS) } },
        select: { rating: true },
      }),
      this.computeCurrentStreak(deckId),
    ]);

    const cardsByState = { New: 0, Learning: 0, Review: 0, Relearning: 0 };
    for (const row of groupedByState) {
      const name = STATE_NAMES[row.state];
      if (name) {
        cardsByState[name] = row._count._all;
      }
    }

    const retentionRate =
      recentLogs.length === 0
        ? null
        : Math.round((recentLogs.filter((log) => log.rating >= Rating.Good).length / recentLogs.length) * 100);

    return {
      totalCards,
      cardsByState,
      retentionRate,
      masteredCards,
      // Donnée secondaire par design : un simple compteur, jamais mis en avant
      // ni assorti d'indicateur de rupture alarmiste (voir CLAUDE.md).
      currentStreak,
    };
  }

  async getHistory(userId: string, deckId: string) {
    await this.assertDeckOwnership(userId, deckId);

    const todayStart = startOfDay(new Date());
    const windowStart = subDays(todayStart, HISTORY_WINDOW_DAYS - 1);

    const logs = await this.prisma.reviewLog.findMany({
      where: { card: { deckId }, reviewedAt: { gte: windowStart } },
      select: { reviewedAt: true, rating: true },
    });

    const byDay = new Map<string, { count: number; successCount: number }>();
    for (let i = 0; i < HISTORY_WINDOW_DAYS; i++) {
      const day = subDays(todayStart, HISTORY_WINDOW_DAYS - 1 - i);
      byDay.set(formatDateKey(day), { count: 0, successCount: 0 });
    }

    for (const log of logs) {
      const entry = byDay.get(formatDateKey(startOfDay(log.reviewedAt)));
      if (entry) {
        entry.count += 1;
        if (log.rating >= Rating.Good) {
          entry.successCount += 1;
        }
      }
    }

    return Array.from(byDay.entries()).map(([date, stats]) => ({ date, ...stats }));
  }

  async getProgressHighlight(userId: string, deckId: string) {
    await this.assertDeckOwnership(userId, deckId);

    const now = new Date();
    const windowStart = subDays(now, PROGRESS_HIGHLIGHT_WINDOW_MAX_DAYS);
    const windowEnd = subDays(now, PROGRESS_HIGHLIGHT_WINDOW_MIN_DAYS);

    const lapseCandidates = await this.prisma.reviewLog.findMany({
      where: {
        rating: Rating.Again,
        reviewedAt: { gte: windowStart, lte: windowEnd },
        card: { deckId },
      },
      include: { card: true },
    });

    let best: { card: Card; oldLog: ReviewLog; recentLog: ReviewLog; reviewsBetween: number } | null = null;

    for (const lapse of lapseCandidates) {
      const subsequentLogs = await this.prisma.reviewLog.findMany({
        where: { cardId: lapse.cardId, reviewedAt: { gt: lapse.reviewedAt } },
        orderBy: { reviewedAt: 'asc' },
      });

      const successfulLogs = subsequentLogs.filter((log) => log.rating >= Rating.Good);
      if (successfulLogs.length === 0) {
        continue;
      }

      const recentLog = successfulLogs[successfulLogs.length - 1];
      const reviewsBetween = subsequentLogs.filter((log) => log.reviewedAt <= recentLog.reviewedAt).length;

      if (!best || reviewsBetween > best.reviewsBetween) {
        best = { card: lapse.card, oldLog: lapse, recentLog, reviewsBetween };
      }
    }

    if (!best) {
      return { available: false };
    }

    return {
      available: true,
      card: {
        id: best.card.id,
        type: best.card.type,
        front: best.card.front,
        back: best.card.back,
      },
      oldReview: {
        rating: best.oldLog.rating,
        userAnswer: best.oldLog.userAnswer,
        aiVerdict: best.oldLog.aiVerdict,
        reviewedAt: best.oldLog.reviewedAt,
      },
      recentReview: {
        rating: best.recentLog.rating,
        userAnswer: best.recentLog.userAnswer,
        aiVerdict: best.recentLog.aiVerdict,
        reviewedAt: best.recentLog.reviewedAt,
      },
    };
  }
}
