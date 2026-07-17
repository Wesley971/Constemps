import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { GenerateCardsDto } from './dto/generate-cards.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('decks/:deckId/cards')
  create(@CurrentUser() user: AuthenticatedUser, @Param('deckId') deckId: string, @Body() dto: CreateCardDto) {
    return this.cardsService.create(user.id, deckId, dto);
  }

  @Post('decks/:deckId/cards/generate')
  generateCards(@CurrentUser() user: AuthenticatedUser, @Param('deckId') deckId: string, @Body() dto: GenerateCardsDto) {
    return this.cardsService.generateCards(user.id, deckId, dto.text);
  }

  @Get('decks/:deckId/cards')
  findAllForDeck(@CurrentUser() user: AuthenticatedUser, @Param('deckId') deckId: string) {
    return this.cardsService.findAllForDeck(user.id, deckId);
  }

  @Get('cards/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.cardsService.findOne(user.id, id);
  }

  @Patch('cards/:id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.cardsService.update(user.id, id, dto);
  }

  @Delete('cards/:id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.cardsService.remove(user.id, id);
    return { success: true };
  }
}
