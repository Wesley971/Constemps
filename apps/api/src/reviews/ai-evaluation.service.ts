import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export type AiVerdict = 'compris' | 'partiellement' | 'incompris';

export interface AiEvaluationResult {
  verdict: AiVerdict;
  justification?: string;
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const VALID_VERDICTS: AiVerdict[] = ['compris', 'partiellement', 'incompris'];

function buildPrompt(question: string, referenceAnswer: string, userAnswer: string): string {
  return `Tu évalues la compréhension d'un concept par un élève, dans le cadre d'une app de révision espacée.

Question posée : ${question}
Réponse de référence : ${referenceAnswer}
Réponse de l'élève : ${userAnswer}

Juge uniquement si l'élève a compris le concept sur le fond. Ignore la formulation exacte, le style et l'orthographe.

Réponds avec exactement un verdict parmi ces trois valeurs : "compris", "partiellement", "incompris".

Réponds strictement au format JSON, sans aucun texte avant ou après, exactement sous cette forme :
{ "verdict": "compris" }`;
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
export class AiEvaluationService {
  private readonly logger = new Logger(AiEvaluationService.name);

  async evaluate(question: string, referenceAnswer: string, userAnswer: string): Promise<AiEvaluationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY absente, repli sur l\'évaluation par recouvrement lexical');
      return this.fallbackEvaluate(referenceAnswer, userAnswer);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: buildPrompt(question, referenceAnswer, userAnswer),
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
