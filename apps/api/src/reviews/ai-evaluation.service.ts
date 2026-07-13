import { Injectable } from '@nestjs/common';

export type AiVerdict = 'compris' | 'partiellement' | 'incompris';

export interface AiEvaluationResult {
  verdict: AiVerdict;
  justification?: string;
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
  async evaluate(question: string, referenceAnswer: string, userAnswer: string): Promise<AiEvaluationResult> {
    return this.mockEvaluate(question, referenceAnswer, userAnswer);
  }

  private async mockEvaluate(
    _question: string,
    referenceAnswer: string,
    userAnswer: string,
  ): Promise<AiEvaluationResult> {
    const referenceWords = normalizeToWordSet(referenceAnswer);
    const userWords = normalizeToWordSet(userAnswer);

    if (referenceWords.size === 0 || userWords.size === 0) {
      return { verdict: 'incompris', justification: 'Réponse vide ou non comparable à la réponse de référence.' };
    }

    const overlap = [...referenceWords].filter((word) => userWords.has(word)).length;
    const overlapRatio = overlap / referenceWords.size;

    if (overlapRatio >= 0.6) {
      return { verdict: 'compris', justification: 'La réponse couvre la majorité des éléments attendus.' };
    }
    if (overlapRatio >= 0.3) {
      return { verdict: 'partiellement', justification: 'La réponse couvre seulement une partie des éléments attendus.' };
    }
    return { verdict: 'incompris', justification: 'La réponse ne correspond pas à la réponse de référence.' };
  }
}
