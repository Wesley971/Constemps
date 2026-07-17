import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import type { CardType } from '@prisma/client';

export type AiVerdict = 'compris' | 'partiellement' | 'incompris';

export interface AiEvaluationResult {
  verdict: AiVerdict;
  justification?: string;
}

export interface GeneratedCard {
  type: CardType;
  front: string;
  back: string;
}

const GEMINI_MODEL = 'gemini-flash-lite-latest';
const VALID_VERDICTS: AiVerdict[] = ['compris', 'partiellement', 'incompris'];
const MIN_GENERATED_CARDS = 5;
const BASE_MAX_GENERATED_CARDS = 15;

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

function computeMaxGeneratedCards(textLength: number): number {
  if (textLength > 30000) return 25;
  if (textLength > 15000) return 20;
  return BASE_MAX_GENERATED_CARDS;
}

function buildGenerateCardsPrompt(text: string, maxCards: number): string {
  return `Tu génères des fiches de révision (flashcards) à partir d'un texte fourni par l'utilisateur, dans une app de révision espacée. Ton rôle n'est pas d'extraire des passages du texte, mais de jouer le rôle de quelqu'un qui a compris le texte et qui l'explique avec ses propres mots à quelqu'un d'autre.

Texte source :
"""
${text}
"""

RÈGLE ABSOLUE - Reformulation obligatoire :
Il est strictement interdit de recopier une phrase du texte source telle quelle, que ce soit dans le "front" ou dans le "back", pour CLASSIC comme pour OPEN_QUESTION. Reformule systématiquement avec des mots différents de ceux du texte. Avant de finaliser chaque fiche, vérifie toi-même : "Est-ce qu'une phrase entière de cette fiche pourrait être retrouvée mot pour mot dans le texte source ?" Si oui, reformule-la avant de la garder.

RÈGLE - Une fiche = un seul concept, aussi court que possible :
Chaque fiche doit porter sur un unique concept clé, exprimé de façon aussi courte et claire que possible. Il n'y a pas de limite de caractères imposée, mais si tu sens que tu as besoin d'une phrase longue ou de plusieurs idées enchaînées pour répondre, c'est le signe que ce concept doit être scindé en plusieurs fiches distinctes plutôt que compressé en une seule.

RÈGLE - Priorise les concepts structurants :
Ne génère pas une fiche par fait mineur mentionné dans le texte. Repère plutôt les quelques idées qui structurent réellement la compréhension du sujet (celles qui donnent du sens au reste) et concentre-toi dessus. Mieux vaut ${MIN_GENERATED_CARDS} à 6 fiches vraiment pertinentes que ${maxCards} fiches qui listent mécaniquement tous les détails.

RÈGLE - OPEN_QUESTION teste la compréhension, pas le rappel :
Une question ouverte doit forcer à raisonner sur le concept ("Pourquoi X entraîne Y ?", "Quelle est la différence entre X et Y ?", "Que se passerait-il si X changeait ?"), jamais interroger la formulation du texte ("Que dit le texte à propos de X ?", "Comment le texte décrit-il X ?"). Le but est de vérifier que l'utilisateur a intégré le concept, pas qu'il se souvient des mots du texte.

Exemple concret (à ne pas recopier, juste pour ancrer l'attendu) :

MAUVAISE fiche (copiée du texte, trop longue, teste le rappel) :
{ "type": "OPEN_QUESTION", "front": "Que dit le texte à propos du rôle de la lumière dans la photosynthèse ?", "back": "La photosynthèse est le processus par lequel les plantes vertes, les algues et certaines bactéries convertissent l'énergie lumineuse, généralement issue du soleil, en énergie chimique stockée dans des molécules de glucose." }

BONNE fiche (reformulée, un seul concept, courte, teste la compréhension) :
{ "type": "OPEN_QUESTION", "front": "Pourquoi une plante a-t-elle besoin de lumière pour fabriquer du glucose ?", "back": "La lumière apporte l'énergie que la plante convertit et stocke sous forme chimique dans le glucose ; sans cette énergie, la réaction ne peut pas se produire." }

Pour chaque fiche, choisis toi-même le type le plus adapté :
- "CLASSIC" pour du vocabulaire, une traduction ou une définition courte (front = terme/mot/question courte, back = traduction/définition courte, reformulée)
- "OPEN_QUESTION" pour une vraie question de compréhension nécessitant une réponse rédigée (front = question de compréhension, back = réponse de référence attendue, pas une réponse d'élève)

Ne génère pas de doublons, ne pose pas de questions triviales, reste fidèle au sens du texte (mais jamais à sa formulation exacte). Génère entre ${MIN_GENERATED_CARDS} et ${maxCards} fiches, en respectant la priorité aux concepts structurants avant tout.

Réponds strictement au format JSON, sans aucun texte avant ou après, exactement sous cette forme :
[{ "type": "CLASSIC", "front": "...", "back": "..." }, { "type": "OPEN_QUESTION", "front": "...", "back": "..." }]`;
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

  async generateCards(text: string): Promise<GeneratedCard[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('Service de génération de cards non configuré');
    }

    const maxCards = computeMaxGeneratedCards(text.length);

    let responseText: string | undefined;
    try {
      const response = await this.getClient(apiKey).models.generateContent({
        model: GEMINI_MODEL,
        contents: buildGenerateCardsPrompt(text, maxCards),
        config: { responseMimeType: 'application/json' },
      });
      responseText = response.text;
    } catch (err) {
      this.logger.error('Appel Gemini échoué pour la génération de cards', err instanceof Error ? err.stack : String(err));
      throw new BadGatewayException('La génération de cards a échoué');
    }

    const cards = this.parseGeneratedCards(responseText);
    if (!cards) {
      this.logger.error(`Réponse Gemini mal formée pour la génération de cards : ${responseText}`);
      throw new BadGatewayException('La génération de cards a échoué');
    }

    return cards;
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

  private parseGeneratedCards(text: string | undefined): GeneratedCard[] | null {
    if (!text) return null;

    try {
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed) || parsed.length === 0) return null;

      const cards: GeneratedCard[] = [];
      for (const item of parsed) {
        if (typeof item !== 'object' || item === null) return null;
        const { type, front, back } = item as Record<string, unknown>;
        if (
          (type !== 'CLASSIC' && type !== 'OPEN_QUESTION') ||
          typeof front !== 'string' ||
          front.trim().length === 0 ||
          typeof back !== 'string' ||
          back.trim().length === 0
        ) {
          return null;
        }
        cards.push({ type, front: front.trim(), back: back.trim() });
      }
      return cards;
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
