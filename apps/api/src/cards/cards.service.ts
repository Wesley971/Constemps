import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { DecksService } from '../decks/decks.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

const AUDIO_DIR = join(process.cwd(), 'uploads', 'audio');

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly decksService: DecksService,
  ) {}

  async create(userId: string, deckId: string, dto: CreateCardDto) {
    await this.decksService.findOne(userId, deckId);
    return this.prisma.card.create({
      data: {
        deckId,
        type: dto.type,
        front: dto.front,
        back: dto.back,
      },
    });
  }

  async generateCards(userId: string, deckId: string, text: string) {
    await this.decksService.findOne(userId, deckId);
    return this.aiService.generateCards(text);
  }

  async findAllForDeck(userId: string, deckId: string) {
    await this.decksService.findOne(userId, deckId);
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
      throw new NotFoundException('Card introuvable');
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

  async generateAudio(userId: string, id: string) {
    const card = await this.findOne(userId, id);
    const audioBuffer = await this.aiService.generateAudio(card.front);

    mkdirSync(AUDIO_DIR, { recursive: true });
    const filename = `${id}-${randomUUID()}.wav`;
    writeFileSync(join(AUDIO_DIR, filename), audioBuffer);

    return this.prisma.card.update({
      where: { id },
      data: { audioUrl: `/audio/${filename}` },
    });
  }
}
