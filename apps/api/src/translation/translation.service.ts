import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AiService, type TranslationDirection } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  isValidLearningLanguage,
  NATIVE_LANGUAGE,
  type SupportedLanguage,
} from '../common/languages';

export interface TranslationResult {
  translation: string;
  sourceLang: string;
  targetLang: string;
  sourceIsFrench: boolean;
}

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  // Règle CON-55 : un recto en français part vers la langue d'apprentissage,
  // tout le reste part vers le français. forceSourceIsFrench (bouton
  // "Inverser") remplace seulement le verdict de détection, jamais la cible.
  async translate(
    userId: string,
    text: string,
    forceSourceIsFrench?: boolean,
  ): Promise<TranslationResult> {
    const learningLanguage = await this.getLearningLanguage(userId);

    const direction: TranslationDirection =
      forceSourceIsFrench === undefined
        ? { kind: 'auto', learningLanguage }
        : forceSourceIsFrench
          ? { kind: 'fromNative', targetLanguage: learningLanguage }
          : { kind: 'toNative', learningLanguage };

    const result = await this.aiService.translate(text, direction);

    const sourceIsFrench = result.sourceLanguage === NATIVE_LANGUAGE;
    const expectedTarget = sourceIsFrench ? learningLanguage : NATIVE_LANGUAGE;
    const verdictRespected =
      forceSourceIsFrench === undefined ||
      forceSourceIsFrench === sourceIsFrench;

    // Gemini applique la règle lui-même dans le même appel : on vérifie qu'il
    // l'a bien suivie plutôt que de servir une traduction partie dans la
    // mauvaise langue sans que personne ne s'en aperçoive.
    if (!verdictRespected || result.targetLanguage !== expectedTarget) {
      this.logger.error(
        `Direction de traduction incohérente (attendu ${expectedTarget}, verdict imposé ${String(forceSourceIsFrench)}) : ${JSON.stringify(result)}`,
      );
      throw new BadGatewayException('La traduction a échoué');
    }

    return {
      translation: result.translation,
      sourceLang: result.sourceLanguage,
      targetLang: result.targetLanguage,
      sourceIsFrench,
    };
  }

  private async getLearningLanguage(
    userId: string,
  ): Promise<SupportedLanguage> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { learningLanguage: true },
    });

    // Aucune UI ne l'écrit encore : une valeur hors liste ne peut venir que
    // d'une modification manuelle en base, et doit se voir plutôt que d'être
    // remplacée en silence par le défaut.
    if (!isValidLearningLanguage(user.learningLanguage)) {
      this.logger.error(
        `learningLanguage invalide pour l'utilisateur ${userId} : ${user.learningLanguage}`,
      );
      throw new InternalServerErrorException("Langue d'apprentissage invalide");
    }

    return user.learningLanguage;
  }
}
