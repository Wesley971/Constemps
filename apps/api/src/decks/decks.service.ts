import { Injectable, NotFoundException } from '@nestjs/common';
import { Rating, State } from 'ts-fsrs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import {
  computeAdaptiveDailyGoal,
  DAILY_GOAL_WINDOW_MS,
  MIN_DAILY_GOAL,
  MIN_DAILY_GOAL_FRACTION_DIVISOR,
} from '../common/daily-goal';
import { startOfDay } from '../common/date';

// Card.state / ReviewLog.rating sont des colonnes Int côté Prisma : on compare
// à des constantes typées number (plutôt qu'un cast `as number` sur l'enum,
// que TypeScript juge inutile alors qu'eslint le juge nécessaire) pour
// satisfaire à la fois le compilateur et no-unsafe-enum-comparison.
const NEW_CARD_STATE: number = State.New;
const GOOD_RATING: number = Rating.Good;

@Injectable()
export class DecksService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateDeckDto) {
    return this.prisma.deck.create({
      data: { name: dto.name, color: dto.color, icon: dto.icon, userId },
    });
  }

  // dailyGoalReached calculé en batch (2 requêtes au total, quel que soit le
  // nombre de decks/cards) plutôt qu'en boucle par deck, pour éviter le N+1
  // signalé sur CON-36. Reflète uniquement le palier normal (goal_reached),
  // jamais le palier étendu : voir computeAdaptiveDailyGoal (common/daily-goal.ts),
  // formule partagée avec ReviewsService.computeDailyGoal.
  async findAll(userId: string) {
    const decks = await this.prisma.deck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { cards: { select: { id: true, state: true, due: true } } },
    });

    if (decks.length === 0) {
      return [];
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - DAILY_GOAL_WINDOW_MS);
    const todayStart = startOfDay(now);

    const cardToDeck = new Map<string, string>();
    const hasUnseenDueByDeck = new Map<string, boolean>();
    for (const deck of decks) {
      hasUnseenDueByDeck.set(
        deck.id,
        deck.cards.some(
          (card) => card.state === NEW_CARD_STATE && card.due <= now,
        ),
      );
      for (const card of deck.cards) {
        cardToDeck.set(card.id, deck.id);
      }
    }

    const cardIds = [...cardToDeck.keys()];
    const logs = cardIds.length
      ? await this.prisma.reviewLog.findMany({
          where: { cardId: { in: cardIds } },
          select: { cardId: true, reviewedAt: true, rating: true },
        })
      : [];

    const firstReviewedAtByDeck = new Map<string, Date>();
    const successfulInWindowByDeck = new Map<string, Date[]>();
    const reviewedTodayByDeck = new Map<string, number>();

    for (const log of logs) {
      const deckId = cardToDeck.get(log.cardId);
      if (!deckId) continue;

      const currentFirst = firstReviewedAtByDeck.get(deckId);
      if (!currentFirst || log.reviewedAt < currentFirst) {
        firstReviewedAtByDeck.set(deckId, log.reviewedAt);
      }

      if (
        log.rating >= GOOD_RATING &&
        log.reviewedAt >= windowStart &&
        log.reviewedAt <= now
      ) {
        const arr = successfulInWindowByDeck.get(deckId) ?? [];
        arr.push(log.reviewedAt);
        successfulInWindowByDeck.set(deckId, arr);
      }

      if (log.reviewedAt >= todayStart) {
        reviewedTodayByDeck.set(
          deckId,
          (reviewedTodayByDeck.get(deckId) ?? 0) + 1,
        );
      }
    }

    return decks.map(({ cards, ...deck }) => {
      let dailyGoal = computeAdaptiveDailyGoal({
        firstReviewedAt: firstReviewedAtByDeck.get(deck.id) ?? null,
        successfulLogsInWindow: successfulInWindowByDeck.get(deck.id) ?? [],
        defaultGoal: deck.dailyGoal,
      });
      if (dailyGoal === MIN_DAILY_GOAL && hasUnseenDueByDeck.get(deck.id)) {
        dailyGoal = Math.max(
          dailyGoal,
          Math.round(deck.dailyGoal / MIN_DAILY_GOAL_FRACTION_DIVISOR),
        );
      }
      const reviewedToday = reviewedTodayByDeck.get(deck.id) ?? 0;

      return {
        ...deck,
        cardCount: cards.length,
        dailyGoalReached: reviewedToday >= dailyGoal,
      };
    });
  }

  async findOne(userId: string, id: string) {
    const deck = await this.prisma.deck.findUnique({ where: { id } });
    if (!deck || deck.userId !== userId) {
      throw new NotFoundException('Deck introuvable');
    }
    return deck;
  }

  async update(userId: string, id: string, dto: UpdateDeckDto) {
    await this.findOne(userId, id);
    return this.prisma.deck.update({
      where: { id },
      data: { name: dto.name, color: dto.color, icon: dto.icon },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.deck.delete({ where: { id } });
  }
}
