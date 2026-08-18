import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { DecksModule } from '../decks/decks.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [DecksModule, AiModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
