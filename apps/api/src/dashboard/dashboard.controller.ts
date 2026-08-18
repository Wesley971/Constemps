import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
import { DashboardService, DEFAULT_ACTIVITY_DAYS } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getSummary(user.id);
  }

  @Get('activity')
  getActivity(
    @CurrentUser() user: AuthenticatedUser,
    @Query('days') daysParam?: string,
  ) {
    const days = daysParam ? Number(daysParam) : DEFAULT_ACTIVITY_DAYS;
    return this.dashboardService.getActivity(
      user.id,
      Number.isFinite(days) && days > 0 ? days : DEFAULT_ACTIVITY_DAYS,
    );
  }
}
