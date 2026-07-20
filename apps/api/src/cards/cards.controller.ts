import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { AI_THROTTLE, AUDIO_THROTTLE } from '../common/ai-throttle';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { GenerateCardsDto } from './dto/generate-cards.dto';

@Controller()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('decks/:deckId/cards')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
    @Body() dto: CreateCardDto,
  ) {
    return this.cardsService.create(user.id, deckId, dto);
  }

  @Throttle(AI_THROTTLE)
  @Post('decks/:deckId/cards/generate')
  generateCards(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
    @Body() dto: GenerateCardsDto,
  ) {
    return this.cardsService.generateCards(user.id, deckId, dto.text);
  }

  @Get('decks/:deckId/cards')
  findAllForDeck(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
  ) {
    return this.cardsService.findAllForDeck(user.id, deckId);
  }

  @Get('cards/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.cardsService.findOne(user.id, id);
  }

  @Patch('cards/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardsService.update(user.id, id, dto);
  }

  @Delete('cards/:id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.cardsService.remove(user.id, id);
    return { success: true };
  }

  @Throttle(AUDIO_THROTTLE)
  @Post('cards/:id/audio')
  generateAudio(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.cardsService.generateAudio(user.id, id);
  }
}
