import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TranslationService } from './translation.service';
import { TranslateDto } from './dto/translate.dto';

@UseGuards(JwtAuthGuard)
@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post()
  async translate(@Body() dto: TranslateDto) {
    const translation = await this.translationService.translate(dto.text, dto.targetLang);
    return { translation };
  }
}
