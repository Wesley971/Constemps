import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { fsrs, Rating, State } from 'ts-fsrs';
import type { Card as FsrsCardInput, Grade } from 'ts-fsrs';
import { PrismaService } from '../prisma/prisma.service';
import { AiService, AiVerdict } from '../ai/ai.service';
import { ManualRating, SubmitReviewDto } from './dto/submit-review.dto';

const DAILY_GOAL_WINDOW_DAYS = 7;
const DAILY_GOAL_WINDOW_MS = DAILY_GOAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const MIN_DAILY_GOAL = 1;
// Quand la moyenne mobile s'effondre au plancher (deck peu régulier), on ne
// bloque pas complètement les cards jamais révisées : le palier remonte à une
// fraction du dailyGoal par défaut du deck plutôt que de rester bloqué à 1.
const MIN_DAILY_GOAL_FRACTION_DIVISOR = 3;

const MANUAL_RATING_TO_GRADE: Record<ManualRating, Grade> = {
  [ManualRating.AGAIN]: Rating.Again,
  [ManualRating.HARD]: Rating.Hard,
  [ManualRating.GOOD]: Rating.Good,
  [ManualRating.EASY]: Rating.Easy,
};

const AI_VERDICT_TO_GRADE: Record<AiVerdict, Grade> = {
  compris: Rating.Good,
  partiellement: Rating.Hard,
  incompris: Rating.Again,
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const scheduler = fsrs({ enable_short_term: false });

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  private async assertDeckOwnership(userId: string, deckId: string) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck || deck.userId !== userId) {
      throw new NotFoundException('Deck not found');
    }
    return deck;
  }

  private async computeDailyGoal(
    deckId: string,
    defaultGoal: number,
  ): Promise<number> {
    const firstLog = await this.prisma.reviewLog.findFirst({
      where: { card: { deckId } },
      orderBy: { reviewedAt: 'asc' },
      select: { reviewedAt: true },
    });

    if (!firstLog) {
      return defaultGoal;
    }

    const daysSinceFirstReview = Math.floor(
      (Date.now() - firstLog.reviewedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceFirstReview < DAILY_GOAL_WINDOW_DAYS) {
      return defaultGoal;
    }

    // Fenêtre glissante des 7×24h précédentes, pas calée sur des frontières
    // calendaires : sinon les logs proches des bords de journée disparaissent
    // de la moyenne (cf. bug du palier tombé à 1 sur le deck Anglais).
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - DAILY_GOAL_WINDOW_MS);

    const successfulLogs = await this.prisma.reviewLog.findMany({
      where: {
        card: { deckId },
        reviewedAt: { gte: windowStart, lte: windowEnd },
        rating: { gte: Rating.Good },
      },
      select: { reviewedAt: true },
    });

    const countsByDay = new Map<string, number>();
    for (const log of successfulLogs) {
      const key = startOfDay(log.reviewedAt).toISOString();
      countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
    }

    const total = [...countsByDay.values()].reduce(
      (sum, count) => sum + count,
      0,
    );
    const average = total / DAILY_GOAL_WINDOW_DAYS;
    return Math.max(MIN_DAILY_GOAL, Math.round(average));
  }

  async getSession(userId: string, deckId: string) {
    const deck = await this.assertDeckOwnership(userId, deckId);
    let dailyGoal = await this.computeDailyGoal(deckId, deck.dailyGoal);

    // Le palier adaptatif peut retomber à son plancher (deck peu régulier).
    // S'il reste des cards jamais révisées (New) déjà dues, ce plancher ne
    // doit pas bloquer complètement la session : on le remonte à une
    // fraction du dailyGoal par défaut du deck plutôt que de rester à 1.
    if (dailyGoal === MIN_DAILY_GOAL) {
      const hasUnseenDueCards = await this.prisma.card.count({
        where: { deckId, state: State.New, due: { lte: new Date() } },
      });
      if (hasUnseenDueCards > 0) {
        dailyGoal = Math.max(
          dailyGoal,
          Math.round(deck.dailyGoal / MIN_DAILY_GOAL_FRACTION_DIVISOR),
        );
      }
    }

    const todayStart = startOfDay(new Date());
    const reviewedToday = await this.prisma.reviewLog.count({
      where: {
        card: { deckId },
        reviewedAt: { gte: todayStart },
      },
    });

    const remaining = dailyGoal - reviewedToday;

    if (remaining <= 0) {
      return {
        done: true,
        message:
          'Palier du jour atteint, bravo ! Reviens demain pour continuer sur ta lancée.',
        dailyGoal,
        reviewedToday,
      };
    }

    const cards = await this.prisma.card.findMany({
      where: { deckId, due: { lte: new Date() } },
      orderBy: { due: 'asc' },
      take: remaining,
    });

    return {
      done: false,
      dailyGoal,
      reviewedToday,
      cards,
    };
  }

  private async toFsrsCardInput(card: {
    id: string;
    due: Date;
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
    state: number;
  }): Promise<FsrsCardInput> {
    const lastLog = await this.prisma.reviewLog.findFirst({
      where: { cardId: card.id },
      orderBy: { reviewedAt: 'desc' },
      select: { reviewedAt: true, scheduledDays: true },
    });

    return {
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsed_days: 0,
      scheduled_days: lastLog?.scheduledDays ?? 0,
      learning_steps: 0,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
      last_review: lastLog?.reviewedAt,
    };
  }

  async submitReview(userId: string, dto: SubmitReviewDto) {
    const card = await this.prisma.card.findUnique({
      where: { id: dto.cardId },
      include: { deck: { select: { userId: true } } },
    });
    if (!card || card.deck.userId !== userId) {
      throw new NotFoundException('Card not found');
    }

    let grade: Grade;
    let aiVerdict: AiVerdict | null = null;
    let userAnswer: string | null = null;

    if (card.type === 'CLASSIC') {
      if (!dto.rating) {
        throw new BadRequestException('rating is required for CLASSIC cards');
      }
      grade = MANUAL_RATING_TO_GRADE[dto.rating];
    } else {
      if (!dto.userAnswer) {
        throw new BadRequestException(
          'userAnswer is required for OPEN_QUESTION cards',
        );
      }
      userAnswer = dto.userAnswer;
      const evaluation = await this.aiService.evaluate(
        card.front,
        card.back,
        dto.userAnswer,
      );
      aiVerdict = evaluation.verdict;
      grade = AI_VERDICT_TO_GRADE[evaluation.verdict];
    }

    const now = new Date();
    const fsrsCardInput = await this.toFsrsCardInput(card);
    const { card: nextCardState, log } = scheduler.next(
      fsrsCardInput,
      now,
      grade,
    );

    const updatedCard = await this.prisma.card.update({
      where: { id: card.id },
      data: {
        stability: nextCardState.stability,
        difficulty: nextCardState.difficulty,
        due: nextCardState.due,
        lapses: nextCardState.lapses,
        reps: nextCardState.reps,
        state: nextCardState.state,
      },
    });

    await this.prisma.reviewLog.create({
      data: {
        cardId: card.id,
        rating: log.rating,
        userAnswer,
        aiVerdict,
        reviewedAt: now,
        scheduledDays: nextCardState.scheduled_days,
        elapsedDays: log.elapsed_days,
      },
    });

    return { card: updatedCard, aiVerdict };
  }
}
