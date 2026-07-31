import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { AiModule } from '../ai/ai.module';
import { DecksModule } from '../decks/decks.module';

@Module({
  imports: [AiModule, DecksModule],
  controllers: [CardsController],
  providers: [CardsService],
})
export class CardsModule {}
