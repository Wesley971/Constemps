import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AiModule } from '../ai/ai.module';
import { DecksModule } from '../decks/decks.module';

@Module({
  imports: [AiModule, DecksModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
