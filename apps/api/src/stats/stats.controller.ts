import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { StatsService } from './stats.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('decks/:deckId/stats/overview')
  getOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
  ) {
    return this.statsService.getOverview(user.id, deckId);
  }

  @Get('decks/:deckId/stats/history')
  getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
  ) {
    return this.statsService.getHistory(user.id, deckId);
  }

  @Get('decks/:deckId/stats/progress-highlight')
  getProgressHighlight(
    @CurrentUser() user: AuthenticatedUser,
    @Param('deckId') deckId: string,
  ) {
    return this.statsService.getProgressHighlight(user.id, deckId);
  }
}
