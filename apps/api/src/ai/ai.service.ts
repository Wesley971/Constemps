import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export type AiVerdict = 'compris' | 'partiellement' | 'incompris';

export interface AiEvaluationResult {
  verdict: AiVerdict;
  justification?: string;
}

const GEMINI_MODEL = 'gemini-flash-lite-latest';
const VALID_VERDICTS: AiVerdict[] = ['compris', 'partiellement', 'incompris'];

function buildEvaluationPrompt(question: string, referenceAnswer: string, userAnswer: string): string {
  return `Tu évalues la compréhension d'un concept par un élève, dans le cadre d'une app de révision espacée.

Question posée : ${question}
Réponse de référence : ${referenceAnswer}
Réponse de l'élève : ${userAnswer}

Juge uniquement si l'élève a compris le concept sur le fond. Ignore la formulation exacte, le style et l'orthographe.

Réponds avec exactement un verdict parmi ces trois valeurs : "compris", "partiellement", "incompris".

Réponds strictement au format JSON, sans aucun texte avant ou après, exactement sous cette forme :
{ "verdict": "compris" }`;
}

function buildTranslationPrompt(text: string, targetLang: string): string {
  return `Traduis le texte suivant vers la langue dont le code est "${targetLang}".

Texte à traduire : ${text}

Réponds uniquement avec la traduction directe, sans aucun commentaire, explication ou texte additionnel autour.

Réponds strictement au format JSON, sans aucun texte avant ou après, exactement sous cette forme :
{ "translation": "..." }`;
}

function normalizeToWordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async evaluate(question: string, referenceAnswer: string, userAnswer: string): Promise<AiEvaluationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY absente, repli sur l\'évaluation par recouvrement lexical');
      return this.fallbackEvaluate(referenceAnswer, userAnswer);
    }

    try {
      const response = await this.getClient(apiKey).models.generateContent({
        model: GEMINI_MODEL,
        contents: buildEvaluationPrompt(question, referenceAnswer, userAnswer),
        config: { responseMimeType: 'application/json' },
      });

      const verdict = this.parseVerdict(response.text);
      if (!verdict) {
        this.logger.error(`Réponse Gemini mal formée, repli sur le fallback : ${response.text}`);
        return this.fallbackEvaluate(referenceAnswer, userAnswer);
      }

      return { verdict };
    } catch (err) {
      this.logger.error(
        'Appel Gemini échoué, repli sur l\'évaluation par recouvrement lexical',
        err instanceof Error ? err.stack : String(err),
      );
      return this.fallbackEvaluate(referenceAnswer, userAnswer);
    }
  }

  async translate(text: string, targetLang: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('Service de traduction non configuré');
    }

    let responseText: string | undefined;
    try {
      const response = await this.getClient(apiKey).models.generateContent({
        model: GEMINI_MODEL,
        contents: buildTranslationPrompt(text, targetLang),
        config: { responseMimeType: 'application/json' },
      });
      responseText = response.text;
    } catch (err) {
      this.logger.error('Appel Gemini échoué pour la traduction', err instanceof Error ? err.stack : String(err));
      throw new BadGatewayException('La traduction a échoué');
    }

    const translation = this.parseTranslation(responseText);
    if (!translation) {
      this.logger.error(`Réponse Gemini mal formée pour la traduction : ${responseText}`);
      throw new BadGatewayException('La traduction a échoué');
    }

    return translation;
  }

  private getClient(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey });
  }

  private parseVerdict(text: string | undefined): AiVerdict | null {
    if (!text) return null;

    try {
      const parsed = JSON.parse(text) as { verdict?: unknown };
      if (typeof parsed.verdict === 'string' && VALID_VERDICTS.includes(parsed.verdict as AiVerdict)) {
        return parsed.verdict as AiVerdict;
      }
      return null;
    } catch {
      return null;
    }
  }

  private parseTranslation(text: string | undefined): string | null {
    if (!text) return null;

    try {
      const parsed = JSON.parse(text) as { translation?: unknown };
      if (typeof parsed.translation === 'string' && parsed.translation.trim().length > 0) {
        return parsed.translation;
      }
      return null;
    } catch {
      return null;
    }
  }

  private fallbackEvaluate(referenceAnswer: string, userAnswer: string): AiEvaluationResult {
    const referenceWords = normalizeToWordSet(referenceAnswer);
    const userWords = normalizeToWordSet(userAnswer);

    if (referenceWords.size === 0 || userWords.size === 0) {
      return { verdict: 'incompris', justification: 'Réponse vide ou non comparable à la réponse de référence (fallback).' };
    }

    const overlap = [...referenceWords].filter((word) => userWords.has(word)).length;
    const overlapRatio = overlap / referenceWords.size;

    if (overlapRatio >= 0.6) {
      return { verdict: 'compris', justification: 'La réponse couvre la majorité des éléments attendus (fallback).' };
    }
    if (overlapRatio >= 0.3) {
      return {
        verdict: 'partiellement',
        justification: 'La réponse couvre seulement une partie des éléments attendus (fallback).',
      };
    }
    return { verdict: 'incompris', justification: 'La réponse ne correspond pas à la réponse de référence (fallback).' };
  }
}
