import { Module } from '@nestjs/common';
import { TranslationController } from './translation.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [TranslationController],
})
export class TranslationModule {}
