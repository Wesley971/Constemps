import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { SubmitReviewDto } from './dto/submit-review.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('decks/:deckId/reviews/session')
  getSession(@CurrentUser() user: AuthenticatedUser, @Param('deckId') deckId: string) {
    return this.reviewsService.getSession(user.id, deckId);
  }

  @Post('reviews')
  submitReview(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitReviewDto) {
    return this.reviewsService.submitReview(user.id, dto);
  }
}
