import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { AI_THROTTLE } from '../common/ai-throttle';
import { ReviewsService } from './reviews.service';
import { SubmitReviewDto } from './dto/submit-review.dto';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('decks/:deckId/reviews/session')
  getSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
    @Query('extend') extend?: string,
  ) {
    return this.reviewsService.getSession(user.id, deckId, extend === 'true');
  }

  // Le throttle ne s'applique en pratique qu'aux OPEN_QUESTION (voir
  // AppThrottlerGuard.shouldSkip) : seule cette voie appelle Gemini.
  @Throttle(AI_THROTTLE)
  @Post('reviews')
  submitReview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitReviewDto,
  ) {
    return this.reviewsService.submitReview(user.id, dto);
  }
}
