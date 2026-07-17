import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from '../ai/ai.service';
import { TranslateDto } from './dto/translate.dto';

@UseGuards(JwtAuthGuard)
@Controller('translation')
export class TranslationController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  async translate(@Body() dto: TranslateDto) {
    const translation = await this.aiService.translate(
      dto.text,
      dto.targetLang,
    );
    return { translation };
  }
}
