import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';

@Injectable()
export class DecksService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateDeckDto) {
    return this.prisma.deck.create({
      data: { name: dto.name, userId },
    });
  }

  async findAll(userId: string) {
    const decks = await this.prisma.deck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { cards: true } } },
    });
    return decks.map(({ _count, ...deck }) => ({
      ...deck,
      cardCount: _count.cards,
    }));
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
      data: { name: dto.name },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.deck.delete({ where: { id } });
  }
}
