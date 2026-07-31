import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { DecksModule } from '../decks/decks.module';

@Module({
  imports: [DecksModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
