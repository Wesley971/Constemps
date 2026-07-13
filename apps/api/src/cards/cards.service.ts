import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertDeckOwnership(userId: string, deckId: string) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck || deck.userId !== userId) {
      throw new NotFoundException('Deck not found');
    }
  }

  async create(userId: string, deckId: string, dto: CreateCardDto) {
    await this.assertDeckOwnership(userId, deckId);
    return this.prisma.card.create({
      data: {
        deckId,
        type: dto.type,
        front: dto.front,
        back: dto.back,
      },
    });
  }

  async findAllForDeck(userId: string, deckId: string) {
    await this.assertDeckOwnership(userId, deckId);
    return this.prisma.card.findMany({
      where: { deckId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: { deck: { select: { userId: true } } },
    });
    if (!card || card.deck.userId !== userId) {
      throw new NotFoundException('Card not found');
    }
    const { deck: _deck, ...rest } = card;
    return rest;
  }

  async update(userId: string, id: string, dto: UpdateCardDto) {
    await this.findOne(userId, id);
    return this.prisma.card.update({
      where: { id },
      data: { front: dto.front, back: dto.back },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.card.delete({ where: { id } });
  }
}
