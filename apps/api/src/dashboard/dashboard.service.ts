import { Injectable } from '@nestjs/common';
import { Rating } from 'ts-fsrs';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { startOfDay, subDays, formatDateKey } from '../common/date';

const MESSAGE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
// Si le nombre total de reviews a progressé d'au moins ce seuil depuis la
// dernière génération, l'activité a "significativement changé" : on
// régénère avant l'échéance des 24h plutôt que d'attendre le lendemain.
const SIGNIFICANT_ACTIVITY_DELTA = 5;
const RECENT_RESUME_COURT_LIMIT = 3;
const SUCCESSFUL_REVIEWS_WINDOW_DAYS = 7;
// "Ancien" au même sens que le mécanisme de progress-highlight existant
// (StatsService) : un sujet retravaillé il y a au moins ce nombre de jours.
const OLDER_SUBJECT_MIN_AGE_DAYS = 25;
// Mélangé occasionnellement, pas à chaque génération : le message doit rester
// centré sur l'activité récente la plupart du temps.
const OLDER_SUBJECT_MIX_PROBABILITY = 0.35;
export const DEFAULT_ACTIVITY_DAYS = 90;
const MAX_ACTIVITY_DAYS = 365;

// Jours d'activité cumulée sur l'ensemble du compte, pas nécessairement
// consécutifs (voir CLAUDE.md : jamais de compteur qui expose la distance à
// parcourir, ces seuils ne sont donc jamais affichés avant d'être atteints).
// 66 jours reprend le repère habituellement associé à la formation d'une
// habitude durable.
const MILESTONE_THRESHOLDS = [7, 30, 66];

const MILESTONE_MESSAGES: Record<number, string> = {
  7: "Sept jours d'activité cumulés sur ce compte, à ton rythme. C'est le genre de régularité discrète qui construit vraiment quelque chose.",
  30: "Trente jours d'activité cumulés depuis le début. Ce n'est pas une question de rythme parfait : c'est que tu reviens, et ça suffit.",
  66: "Soixante-six jours d'activité cumulés : c'est à peu près ce qu'il faut pour qu'une habitude s'installe durablement. La tienne est bien là.",
};

const NEW_USER_WELCOME_MESSAGE =
  "Bienvenue dans ton espace de révision. Il n'y a pas de bonne façon de commencer : une petite session aujourd'hui suffit pour poser la première pierre.";

// rating est stocké en simple Int côté Prisma (pas l'enum ts-fsrs), d'où le
// cast explicite (même convention que StatsService).
const RATING_GOOD: number = Rating.Good;

interface DashboardUser {
  id: string;
  dashboardMessage: string | null;
  dashboardMessageAt: Date | null;
  dashboardMessageReviewCount: number | null;
}

interface ActivityAggregate {
  totalReviewCount: number;
  successfulReviewsLast7Days: number;
  currentStreakDays: number;
  cumulativeActiveDays: number;
  accountAgeDays: number;
  recentResumeCourts: string[];
  olderResumeCourt: string | null;
}

export interface DashboardMilestone {
  threshold: number;
  message: string;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async getSummary(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const reviewDayTimestamps = await this.getReviewDayTimestamps(userId);
    const aggregate = await this.buildActivityAggregate(
      userId,
      user.createdAt,
      reviewDayTimestamps,
    );

    const [message, milestone] = await Promise.all([
      this.resolveMessage(user, aggregate),
      this.resolveNewMilestone(userId, aggregate.cumulativeActiveDays),
    ]);

    return { message, milestone };
  }

  async getActivity(userId: string, days: number) {
    const boundedDays = Math.min(Math.max(days, 1), MAX_ACTIVITY_DAYS);
    const reviewDayTimestamps = await this.getReviewDayTimestamps(userId);

    const todayStart = startOfDay(new Date());
    const result: { date: string; active: boolean }[] = [];
    for (let i = boundedDays - 1; i >= 0; i--) {
      const day = subDays(todayStart, i);
      result.push({
        date: formatDateKey(day),
        active: reviewDayTimestamps.has(day.getTime()),
      });
    }
    return result;
  }

  private async getReviewDayTimestamps(userId: string): Promise<Set<number>> {
    const logs = await this.prisma.reviewLog.findMany({
      where: { card: { deck: { userId } } },
      select: { reviewedAt: true },
    });
    return new Set(logs.map((log) => startOfDay(log.reviewedAt).getTime()));
  }

  private computeCurrentStreak(reviewDayTimestamps: Set<number>): number {
    let cursor = startOfDay(new Date());
    if (!reviewDayTimestamps.has(cursor.getTime())) {
      // Pas encore révisé aujourd'hui : la journée n'est pas terminée, donc
      // le streak n'est pas "cassé" pour autant (même logique que StatsService).
      cursor = subDays(cursor, 1);
    }

    let streak = 0;
    while (reviewDayTimestamps.has(cursor.getTime())) {
      streak += 1;
      cursor = subDays(cursor, 1);
    }
    return streak;
  }

  private async buildActivityAggregate(
    userId: string,
    accountCreatedAt: Date,
    reviewDayTimestamps: Set<number>,
  ): Promise<ActivityAggregate> {
    const shouldMixOlderSubject = Math.random() < OLDER_SUBJECT_MIX_PROBABILITY;

    const [
      totalReviewCount,
      successfulReviewsLast7Days,
      recentResumeCourtLogs,
      olderResumeCourtLog,
    ] = await Promise.all([
      this.prisma.reviewLog.count({
        where: { card: { deck: { userId } } },
      }),
      this.prisma.reviewLog.count({
        where: {
          card: { deck: { userId } },
          reviewedAt: {
            gte: subDays(new Date(), SUCCESSFUL_REVIEWS_WINDOW_DAYS),
          },
          rating: { gte: RATING_GOOD },
        },
      }),
      this.prisma.reviewLog.findMany({
        where: { card: { deck: { userId } }, resumeCourt: { not: null } },
        orderBy: { reviewedAt: 'desc' },
        take: RECENT_RESUME_COURT_LIMIT,
        select: { resumeCourt: true },
      }),
      shouldMixOlderSubject
        ? this.prisma.reviewLog.findFirst({
            where: {
              card: { deck: { userId } },
              resumeCourt: { not: null },
              reviewedAt: {
                lte: subDays(new Date(), OLDER_SUBJECT_MIN_AGE_DAYS),
              },
            },
            orderBy: { reviewedAt: 'desc' },
            select: { resumeCourt: true },
          })
        : Promise.resolve(null),
    ]);

    const accountAgeDays = Math.floor(
      (Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const recentResumeCourts = recentResumeCourtLogs
      .map((log) => log.resumeCourt)
      .filter((r): r is string => Boolean(r));

    const olderResumeCourt =
      olderResumeCourtLog?.resumeCourt &&
      !recentResumeCourts.includes(olderResumeCourtLog.resumeCourt)
        ? olderResumeCourtLog.resumeCourt
        : null;

    return {
      totalReviewCount,
      successfulReviewsLast7Days,
      currentStreakDays: this.computeCurrentStreak(reviewDayTimestamps),
      cumulativeActiveDays: reviewDayTimestamps.size,
      accountAgeDays,
      recentResumeCourts,
      olderResumeCourt,
    };
  }

  private async resolveMessage(
    user: DashboardUser,
    aggregate: ActivityAggregate,
  ): Promise<string> {
    if (aggregate.totalReviewCount === 0) {
      return NEW_USER_WELCOME_MESSAGE;
    }

    const cacheIsFresh =
      user.dashboardMessage !== null &&
      user.dashboardMessageAt !== null &&
      Date.now() - user.dashboardMessageAt.getTime() <
        MESSAGE_CACHE_MAX_AGE_MS &&
      aggregate.totalReviewCount - (user.dashboardMessageReviewCount ?? 0) <
        SIGNIFICANT_ACTIVITY_DELTA;

    if (cacheIsFresh) {
      return user.dashboardMessage as string;
    }

    const generated = await this.aiService.generateDashboardMessage({
      successfulReviewsLast7Days: aggregate.successfulReviewsLast7Days,
      currentStreakDays: aggregate.currentStreakDays,
      accountAgeDays: aggregate.accountAgeDays,
      recentResumeCourts: aggregate.recentResumeCourts,
      olderResumeCourt: aggregate.olderResumeCourt,
      previousMessage: user.dashboardMessage,
    });

    const message = generated ?? this.buildFallbackMessage(aggregate);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        dashboardMessage: message,
        dashboardMessageAt: new Date(),
        dashboardMessageReviewCount: aggregate.totalReviewCount,
      },
    });

    return message;
  }

  private buildFallbackMessage(aggregate: ActivityAggregate): string {
    if (aggregate.successfulReviewsLast7Days > 0) {
      const count = aggregate.successfulReviewsLast7Days;
      return `Cette semaine, tu as validé ${count} révision${count > 1 ? 's' : ''} sur tes decks. Chaque passage compte, à ton rythme.`;
    }
    return "Pas de révision cette semaine, et ce n'est pas grave : ton espace de révision t'attend dès que tu es prêt à y revenir.";
  }

  private async resolveNewMilestone(
    userId: string,
    cumulativeActiveDays: number,
  ): Promise<DashboardMilestone | null> {
    const reached = MILESTONE_THRESHOLDS.filter(
      (t) => t <= cumulativeActiveDays,
    );
    if (reached.length === 0) {
      return null;
    }

    const existing = await this.prisma.accountMilestone.findMany({
      where: { userId },
      select: { threshold: true },
    });
    const existingThresholds = new Set(existing.map((m) => m.threshold));

    // Un seul nouveau jalon à la fois, même si plusieurs seuils ont été
    // franchis d'un coup (ex. longue absence de connexion) : jamais plusieurs
    // jalons surprise en même temps.
    const newThreshold = reached.find((t) => !existingThresholds.has(t));
    if (newThreshold === undefined) {
      return null;
    }

    try {
      await this.prisma.accountMilestone.create({
        data: { userId, threshold: newThreshold },
      });
    } catch {
      // Course rare entre deux requêtes concurrentes (ex. double appel React
      // StrictMode) : l'autre a déjà enregistré ce jalon. On ne le réaffiche
      // pas cette fois plutôt que de faire échouer le chargement du dashboard.
      return null;
    }

    return {
      threshold: newThreshold,
      message: MILESTONE_MESSAGES[newThreshold],
    };
  }
}
