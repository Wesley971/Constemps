import { Injectable, NotFoundException } from '@nestjs/common';
import type { Deck } from '@prisma/client';
import { Rating } from 'ts-fsrs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import {
  activeSessionGoals,
  computeAdaptiveDailyGoal,
  DAILY_GOAL_WINDOW_MS,
  extendedGoalFor,
  todayGoals,
} from '../common/daily-goal';
import {
  appDaysUntil,
  nextAppDayStart,
  startOfAppDay,
} from '../common/app-day';

type DeckWithCardDues = Deck & { cards: { id: string; due: Date }[] };

// ReviewLog.rating est une colonne Int côté Prisma : on compare à une
// constante typée number (plutôt qu'un cast `as number` sur l'enum, que
// TypeScript juge inutile alors qu'eslint le juge nécessaire) pour satisfaire
// à la fois le compilateur et no-unsafe-enum-comparison.
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
  // jamais le palier étendu : voir computeAdaptiveDailyGoal et todayGoals
  // (common/daily-goal.ts), partagées avec ReviewsService.
  //
  // Ordre d'affichage partout (accueil, Mes decks, « Reprendre ») : favoris
  // d'abord (CON-74), puis chaque groupe du plus récent au plus ancien.
  async findAll(userId: string) {
    const decks = await this.prisma.deck.findMany({
      where: { userId },
      orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
      include: { cards: { select: { id: true, due: true } } },
    });
    return this.withToday(decks);
  }

  // Un deck avec les mêmes champs du jour que la liste (CON-69) : la plaquette
  // de l'intérieur d'un deck compte exactement comme l'accueil et Mes decks.
  async findOneWithToday(userId: string, id: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id },
      include: { cards: { select: { id: true, due: true } } },
    });
    if (!deck || deck.userId !== userId) {
      throw new NotFoundException('Deck introuvable');
    }
    const [withToday] = await this.withToday([deck]);
    return withToday;
  }

  // Calcul unique du palier du jour, des révisions du jour et des cartes dues,
  // partagé par la liste et le détail d'un deck.
  private async withToday(decks: DeckWithCardDues[]) {
    if (decks.length === 0) {
      return [];
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - DAILY_GOAL_WINDOW_MS);
    // Journée de l'app (CON-90) : une carte est disponible dès le début de la
    // journée de son échéance, et la prochaine échéance se compte en journées.
    const todayStart = startOfAppDay(now);
    const dayEnd = nextAppDayStart(now);

    const cardToDeck = new Map<string, string>();
    const dueCardsCountByDeck = new Map<string, number>();
    const nextDueByDeck = new Map<string, Date>();
    for (const deck of decks) {
      let dueCount = 0;
      for (const card of deck.cards) {
        cardToDeck.set(card.id, deck.id);
        if (card.due < dayEnd) {
          dueCount += 1;
        } else {
          const next = nextDueByDeck.get(deck.id);
          if (!next || card.due < next) nextDueByDeck.set(deck.id, card.due);
        }
      }
      dueCardsCountByDeck.set(deck.id, dueCount);
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
      const dueCardsCount = dueCardsCountByDeck.get(deck.id) ?? 0;
      const reviewedToday = reviewedTodayByDeck.get(deck.id) ?? 0;
      // Même palier que l'écran de révision (CON-68) : le palier figé de la
      // session en cours s'il est encore valable, sinon le calcul adaptatif.
      // Lecture seule : seule la révision réécrit le snapshot.
      const activeGoals = activeSessionGoals(deck, reviewedToday, todayStart);
      const adaptiveGoal = activeGoals
        ? activeGoals.dailyGoal
        : computeAdaptiveDailyGoal({
            firstReviewedAt: firstReviewedAtByDeck.get(deck.id) ?? null,
            successfulLogsInWindow: successfulInWindowByDeck.get(deck.id) ?? [],
            dueCardsCount,
          });
      // Puis ramené aux cartes disponibles, par le même calcul que la
      // révision (CON-87) : dailyGoal est le palier affiché, pas le brut.
      const today = todayGoals({
        dailyGoal: adaptiveGoal,
        extendedGoal:
          activeGoals?.extendedGoal ?? extendedGoalFor(adaptiveGoal),
        reviewedToday,
        dueCardsCount,
      });

      return {
        ...deck,
        cardCount: cards.length,
        dailyGoal: today.dailyGoal,
        reviewedToday,
        dueCardsCount,
        dailyGoalReached: today.reached,
        // Même information que le voile de la révision : sans carte due ou
        // palier étendu atteint, ni « Réviser » ni « Continuer aujourd'hui ».
        canContinue: today.canContinue,
        // Quand revient la prochaine carte pas encore disponible (CON-90).
        nextDueInDays: appDaysUntil(now, nextDueByDeck.get(deck.id) ?? null),
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

  // Seul le favori change (CON-74) : nom, couleur et icône restent intacts.
  async setFavorite(userId: string, id: string, isFavorite: boolean) {
    await this.findOne(userId, id);
    return this.prisma.deck.update({
      where: { id },
      data: { isFavorite },
      select: { id: true, isFavorite: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.deck.delete({ where: { id } });
  }
}
