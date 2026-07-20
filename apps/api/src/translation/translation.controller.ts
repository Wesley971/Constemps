import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from '../ai/ai.service';
import { AI_THROTTLE } from '../common/ai-throttle';
import { TranslateDto } from './dto/translate.dto';

@Controller('translation')
export class TranslationController {
  constructor(private readonly aiService: AiService) {}

  @Throttle(AI_THROTTLE)
  @Post()
  async translate(@Body() dto: TranslateDto) {
    const translation = await this.aiService.translate(
      dto.text,
      dto.targetLang,
    );
    return { translation };
  }
}
