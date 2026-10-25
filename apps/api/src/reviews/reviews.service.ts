import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { fsrs, Rating } from 'ts-fsrs';
import type { Card as FsrsCardInput, Grade } from 'ts-fsrs';
import { PrismaService } from '../prisma/prisma.service';
import { AiService, AiVerdict } from '../ai/ai.service';
import { DecksService } from '../decks/decks.service';
import { ManualRating, SubmitReviewDto } from './dto/submit-review.dto';
import { startOfDay } from '../common/date';
import {
  activeSessionGoals,
  computeAdaptiveDailyGoal,
  DAILY_GOAL_WINDOW_DAYS,
  DAILY_GOAL_WINDOW_MS,
  DEFAULT_DAILY_GOAL,
  extendedGoalFor,
  todayGoals,
} from '../common/daily-goal';

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

const scheduler = fsrs({ enable_short_term: false });

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly decksService: DecksService,
  ) {}

  private async computeDailyGoal(
    deckId: string,
    dueCardsCount: number,
  ): Promise<number> {
    const firstLog = await this.prisma.reviewLog.findFirst({
      where: { card: { deckId } },
      orderBy: { reviewedAt: 'asc' },
      select: { reviewedAt: true },
    });

    if (!firstLog) {
      return DEFAULT_DAILY_GOAL;
    }

    const daysSinceFirstReview = Math.floor(
      (Date.now() - firstLog.reviewedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceFirstReview < DAILY_GOAL_WINDOW_DAYS) {
      return DEFAULT_DAILY_GOAL;
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

    return computeAdaptiveDailyGoal({
      firstReviewedAt: firstLog.reviewedAt,
      successfulLogsInWindow: successfulLogs.map((log) => log.reviewedAt),
      dueCardsCount,
    });
  }

  // Regroupe tout le calcul du palier (dailyGoal adaptatif + palier étendu +
  // compteur du jour + cartes dues) sans rien décider : getSession() en tire
  // son affichage, submitReview() son blocage. Paliers bruts : le plafond aux
  // cartes disponibles (todayGoals, CON-87) ne s'applique qu'à l'affichage.
  //
  // Le palier reste figé pour toute la durée d'une session de révision
  // active, y compris à travers un rechargement de page (F5) : on ne
  // recalcule que si aucun snapshot n'existe encore, si le snapshot date
  // d'un autre jour calendaire, ou si la session qu'il décrivait était déjà
  // conclue (palier ou palier étendu atteint), jamais juste parce que le
  // front revient nous interroger en cours de session active. Décision
  // actée sur CON-49 (régression CON-39 : recalcul à chaque submitReview()).
  private async getDailyCapState(deckId: string): Promise<{
    dailyGoal: number;
    extendedGoal: number;
    reviewedToday: number;
    dueCardsCount: number;
  }> {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      select: {
        sessionDailyGoal: true,
        sessionExtendedGoal: true,
        sessionSnapshotAt: true,
      },
    });

    const todayStart = startOfDay(new Date());
    const reviewedToday = await this.prisma.reviewLog.count({
      where: {
        card: { deckId },
        reviewedAt: { gte: todayStart },
      },
    });

    const dueCardsCount = await this.prisma.card.count({
      where: { deckId, due: { lte: new Date() } },
    });

    let dailyGoal: number;
    let extendedGoal: number;

    const activeGoals = activeSessionGoals(deck, reviewedToday, todayStart);
    if (!activeGoals) {
      dailyGoal = await this.computeDailyGoal(deckId, dueCardsCount);
      extendedGoal = extendedGoalFor(dailyGoal);

      await this.prisma.deck.update({
        where: { id: deckId },
        data: {
          sessionDailyGoal: dailyGoal,
          sessionExtendedGoal: extendedGoal,
          sessionSnapshotAt: new Date(),
        },
      });
    } else {
      ({ dailyGoal, extendedGoal } = activeGoals);
    }

    return { dailyGoal, extendedGoal, reviewedToday, dueCardsCount };
  }

  async getSession(userId: string, deckId: string, extend: boolean) {
    await this.decksService.findOne(userId, deckId);
    const capState = await this.getDailyCapState(deckId);
    const { reviewedToday } = capState;
    // Paliers affichés, ramenés aux cartes disponibles (CON-87) : les mêmes que
    // les plaquettes de l'accueil.
    const { dailyGoal, extendedGoal, reached, canContinue } =
      todayGoals(capState);

    // Blocage strict sur le palier étendu brut, jamais sur le palier affiché.
    if (reviewedToday >= capState.extendedGoal) {
      return {
        done: true,
        state: 'capped' as const,
        message:
          'Palier étendu du jour atteint, quelle journée ! Reviens demain pour continuer sur ta lancée.',
        dailyGoal,
        extendedGoal,
        reviewedToday,
      };
    }

    // Palier atteint, ou extension qui a épuisé les cartes dues : la journée se
    // clôt, « Continuer aujourd'hui » seulement s'il reste des cartes dues.
    if (reached && (!extend || !canContinue)) {
      return {
        done: false,
        state: 'goal_reached' as const,
        canContinue,
        message:
          "Palier du jour atteint, bravo ! Tu peux t'arrêter là, ou continuer si tu es motivé aujourd'hui.",
        dailyGoal,
        extendedGoal,
        reviewedToday,
      };
    }

    const target = reviewedToday >= dailyGoal ? extendedGoal : dailyGoal;
    const remaining = target - reviewedToday;

    const cards = await this.prisma.card.findMany({
      where: { deckId, due: { lte: new Date() } },
      orderBy: { due: 'asc' },
      take: remaining,
    });

    return {
      done: false,
      state: 'active' as const,
      dailyGoal,
      extendedGoal,
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
      throw new NotFoundException('Card introuvable');
    }

    const { extendedGoal, reviewedToday } = await this.getDailyCapState(
      card.deckId,
    );

    if (reviewedToday >= extendedGoal) {
      throw new ForbiddenException(
        'Palier étendu du jour déjà atteint, review refusée.',
      );
    }

    let grade: Grade;
    let aiVerdict: AiVerdict | null = null;
    let userAnswer: string | null = null;
    let cePointsForts: string | null = null;
    let cePointsAmeliorer: string | null = null;
    let piste: string | null = null;
    let resumeCourt: string | null = null;

    if (card.type === 'CLASSIC') {
      if (!dto.rating) {
        throw new BadRequestException(
          'La notation est requise pour une card de type classique',
        );
      }
      grade = MANUAL_RATING_TO_GRADE[dto.rating];
    } else {
      if (!dto.userAnswer) {
        throw new BadRequestException(
          'La réponse est requise pour une card de type question ouverte',
        );
      }
      userAnswer = dto.userAnswer;
      const evaluation = await this.aiService.evaluate(
        card.front,
        card.back,
        dto.userAnswer,
      );
      aiVerdict = evaluation.verdict;
      cePointsForts = evaluation.cePointsForts;
      cePointsAmeliorer = evaluation.cePointsAmeliorer;
      piste = evaluation.piste;
      resumeCourt = evaluation.resumeCourt;
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
        cePointsForts,
        cePointsAmeliorer,
        piste,
        resumeCourt,
        reviewedAt: now,
        scheduledDays: nextCardState.scheduled_days,
      },
    });

    return {
      card: updatedCard,
      aiVerdict,
      cePointsForts,
      cePointsAmeliorer,
      piste,
    };
  }
}
