import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AiEvaluationService } from './ai-evaluation.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, AiEvaluationService],
})
export class ReviewsModule {}
