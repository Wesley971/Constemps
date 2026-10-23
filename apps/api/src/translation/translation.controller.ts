import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AI_THROTTLE } from '../common/ai-throttle';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/current-user.decorator';
import { TranslateDto } from './dto/translate.dto';
import { TranslationService } from './translation.service';

@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Throttle(AI_THROTTLE)
  @Post()
  translate(@CurrentUser() user: AuthenticatedUser, @Body() dto: TranslateDto) {
    return this.translationService.translate(
      user.id,
      dto.text,
      dto.forceSourceIsFrench,
    );
  }
}
