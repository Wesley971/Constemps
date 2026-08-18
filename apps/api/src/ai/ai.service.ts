import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import type { CardType } from '@prisma/client';

export type AiVerdict = 'compris' | 'partiellement' | 'incompris';

export interface AiEvaluationResult {
  verdict: AiVerdict;
  cePointsForts: string | null;
  cePointsAmeliorer: string | null;
  piste: string | null;
  resumeCourt: string | null;
}

export interface GeneratedCard {
  type: CardType;
  front: string;
  back: string;
}

export interface DashboardActivitySummaryInput {
  successfulReviewsLast7Days: number;
  currentStreakDays: number;
  accountAgeDays: number;
  recentResumeCourts: string[];
  // Sujet retravaillé il y a un moment (voir DashboardService), fourni seulement
  // occasionnellement : permet au message d'évoquer parfois un chemin parcouru
  // dans le temps plutôt que juste l'activité de la semaine.
  olderResumeCourt?: string | null;
  // Dernier message affiché à cet utilisateur (cache existant), pour éviter que
  // deux générations successives se ressemblent trop dans leur formulation.
  previousMessage?: string | null;
}

const GEMINI_MODEL = 'gemini-flash-lite-latest';
const VALID_VERDICTS: AiVerdict[] = ['compris', 'partiellement', 'incompris'];
const MIN_GENERATED_CARDS = 5;
const BASE_MAX_GENERATED_CARDS = 15;

function buildEvaluationPrompt(
  question: string,
  referenceAnswer: string,
  userAnswer: string,
): string {
  return `Tu évalues la compréhension d'un concept par un élève, dans le cadre d'une app de révision espacée.

Question posée : ${question}
Réponse de référence : ${referenceAnswer}
Réponse de l'élève : ${userAnswer}

Juge uniquement si l'élève a compris le concept sur le fond. Ignore la formulation exacte, le style et l'orthographe.

Détermine un verdict parmi "compris", "partiellement", "incompris", puis complète un feedback pédagogique :
- "compris" : cePointsForts, cePointsAmeliorer, piste et resumeCourt valent tous null.
- "partiellement" : cePointsForts décrit ce qui était juste dans la réponse, cePointsAmeliorer décrit ce qui manquait ou était imprécis, piste donne un conseil concret pour progresser, resumeCourt résume cette piste en quelques mots seulement.
- "incompris" : cePointsForts vaut null, cePointsAmeliorer décrit concrètement ce qui était attendu, piste donne un conseil concret pour progresser, resumeCourt résume cette piste en quelques mots seulement.

resumeCourt n'est jamais une phrase complète : quelques mots seulement, façon mot-clé ou punchline mémorable (par exemple "diffusion de Rayleigh" plutôt qu'une phrase qui l'explique).

Consignes de ton, à respecter strictement : pas d'introduction ni de formule de politesse, uniquement les champs demandés. Ton direct et constructif, jamais culpabilisant. Tutoiement implicite (jamais de vouvoiement), de préférence à l'impératif plutôt que des phrases avec "tu". Phrases courtes.

Réponds strictement au format JSON, sans aucun texte avant ou après, exactement sous cette forme :
{ "verdict": "partiellement", "cePointsForts": "...", "cePointsAmeliorer": "...", "piste": "...", "resumeCourt": "..." }`;
}

function computeMaxGeneratedCards(textLength: number): number {
  if (textLength > 30000) return 25;
  if (textLength > 15000) return 20;
  return BASE_MAX_GENERATED_CARDS;
}

function buildTypeInstructions(forceType: CardType | undefined): string {
  if (forceType === 'CLASSIC') {
    return `Toutes les fiches doivent être de type "CLASSIC" : vocabulaire, traduction ou définition courte (front = terme/mot/question courte, back = traduction/définition courte, reformulée). Ne génère aucune fiche "OPEN_QUESTION".`;
  }
  if (forceType === 'OPEN_QUESTION') {
    return `Toutes les fiches doivent être de type "OPEN_QUESTION" : une vraie question de compréhension nécessitant une réponse rédigée (front = question de compréhension, back = réponse de référence attendue, pas une réponse d'élève). Ne génère aucune fiche "CLASSIC".`;
  }
  return `Pour chaque fiche, choisis toi-même le type le plus adapté :
- "CLASSIC" pour du vocabulaire, une traduction ou une définition courte (front = terme/mot/question courte, back = traduction/définition courte, reformulée)
- "OPEN_QUESTION" pour une vraie question de compréhension nécessitant une réponse rédigée (front = question de compréhension, back = réponse de référence attendue, pas une réponse d'élève)`;
}

function buildExampleJson(forceType: CardType | undefined): string {
  if (forceType === 'CLASSIC') {
    return `[{ "type": "CLASSIC", "front": "...", "back": "..." }]`;
  }
  if (forceType === 'OPEN_QUESTION') {
    return `[{ "type": "OPEN_QUESTION", "front": "...", "back": "..." }]`;
  }
  return `[{ "type": "CLASSIC", "front": "...", "back": "..." }, { "type": "OPEN_QUESTION", "front": "...", "back": "..." }]`;
}

function buildGenerateCardsPrompt(
  text: string,
  maxCards: number,
  forceType?: CardType,
): string {
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

${buildTypeInstructions(forceType)}

Ne génère pas de doublons, ne pose pas de questions triviales, reste fidèle au sens du texte (mais jamais à sa formulation exacte). Génère entre ${MIN_GENERATED_CARDS} et ${maxCards} fiches, en respectant la priorité aux concepts structurants avant tout.

Réponds strictement au format JSON, sans aucun texte avant ou après, exactement sous cette forme :
${buildExampleJson(forceType)}`;
}

function buildDashboardMessagePrompt(
  summary: DashboardActivitySummaryInput,
): string {
  const resumeCourtList =
    summary.recentResumeCourts.length > 0
      ? summary.recentResumeCourts.map((r) => `"${r}"`).join(', ')
      : 'aucun pour le moment';

  const olderSubjectLine = summary.olderResumeCourt
    ? `\n- Un sujet plus ancien, retravaillé de nouveau il y a peu (pas forcément lié aux autres) : "${summary.olderResumeCourt}"`
    : '';

  const previousMessageBlock = summary.previousMessage
    ? `\n\nDernier message affiché à cet utilisateur, à ne surtout pas reproduire : "${summary.previousMessage}"
Formule ce nouveau message différemment : change la structure de phrase, l'ouverture et le vocabulaire par rapport à ce message précédent, même si les données ci-dessus lui ressemblent.`
    : '';

  return `Tu écris le message d'accueil d'un tableau de bord pour une app de révision espacée (flashcards). C'est la toute première chose que l'utilisateur voit en arrivant sur l'app.

Résumé de son activité, tous ses decks confondus :
- Révisions réussies sur les 7 derniers jours : ${summary.successfulReviewsLast7Days}
- Jours d'affilée avec au moins une révision, en ce moment : ${summary.currentStreakDays}
- Ancienneté du compte : ${summary.accountAgeDays} jour(s)
- Quelques sujets récemment travaillés (résumés courts, pas forcément liés entre eux) : ${resumeCourtList}${olderSubjectLine}${previousMessageBlock}

Écris UNE à deux phrases courtes, chaleureuses et sincères, qui donnent du sens humain à cette activité.

Consignes de ton, à respecter strictement :
- Jamais de pourcentage ni de chiffre affiché seul sans le remettre en contexte dans une phrase.
- Jamais de vocabulaire de performance ou de comparaison ("meilleur", "record", "classement", "score", "objectif").
- Jamais culpabilisant, même si l'activité récente est faible : pas de "tu devrais", pas de rappel de retard, pas d'allusion à ce qui n'a pas été fait.
- Jamais la tournure "Tu y es presque !" ni ses variantes.
- Tutoiement, ton direct et sincère, comme un ami qui remarque un vrai progrès, jamais un coach qui motive.
- Si l'activité récente est faible ou nulle, ne le souligne pas : parle plutôt de ce qui a été fait, aussi modeste soit-il, ou reste simplement accueillant.${olderSubjectLine ? "\n- Un sujet plus ancien est mentionné ci-dessus : si ça sonne naturel, évoque un vrai chemin parcouru dans le temps entre ce sujet-là et l'activité récente, sans jamais forcer artificiellement ce lien." : ''}

Réponds strictement au format JSON, sans aucun texte avant ou après, exactement sous cette forme :
{ "message": "..." }`;
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

  async evaluate(
    question: string,
    referenceAnswer: string,
    userAnswer: string,
  ): Promise<AiEvaluationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        "GEMINI_API_KEY absente, repli sur l'évaluation par recouvrement lexical",
      );
      return this.fallbackEvaluate(referenceAnswer, userAnswer);
    }

    try {
      const response = await this.getClient(apiKey).models.generateContent({
        model: GEMINI_MODEL,
        contents: buildEvaluationPrompt(question, referenceAnswer, userAnswer),
        config: { responseMimeType: 'application/json' },
      });

      const evaluation = this.parseEvaluation(response.text);
      if (!evaluation) {
        this.logger.error(
          `Réponse Gemini mal formée, repli sur le fallback : ${response.text}`,
        );
        return this.fallbackEvaluate(referenceAnswer, userAnswer);
      }

      return evaluation;
    } catch (err) {
      this.logger.error(
        "Appel Gemini échoué, repli sur l'évaluation par recouvrement lexical",
        err instanceof Error ? err.stack : String(err),
      );
      return this.fallbackEvaluate(referenceAnswer, userAnswer);
    }
  }

  async translate(text: string, targetLang: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Service de traduction non configuré',
      );
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
      this.logger.error(
        'Appel Gemini échoué pour la traduction',
        err instanceof Error ? err.stack : String(err),
      );
      throw new BadGatewayException('La traduction a échoué');
    }

    const translation = this.parseTranslation(responseText);
    if (!translation) {
      this.logger.error(
        `Réponse Gemini mal formée pour la traduction : ${responseText}`,
      );
      throw new BadGatewayException('La traduction a échoué');
    }

    return translation;
  }

  async generateCards(
    text: string,
    forceType?: CardType,
  ): Promise<GeneratedCard[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Service de génération de cards non configuré',
      );
    }

    const maxCards = computeMaxGeneratedCards(text.length);

    let responseText: string | undefined;
    try {
      const response = await this.getClient(apiKey).models.generateContent({
        model: GEMINI_MODEL,
        contents: buildGenerateCardsPrompt(text, maxCards, forceType),
        config: { responseMimeType: 'application/json' },
      });
      responseText = response.text;
    } catch (err) {
      this.logger.error(
        'Appel Gemini échoué pour la génération de cards',
        err instanceof Error ? err.stack : String(err),
      );
      throw new BadGatewayException('La génération de cards a échoué');
    }

    const cards = this.parseGeneratedCards(responseText);
    if (!cards) {
      this.logger.error(
        `Réponse Gemini mal formée pour la génération de cards : ${responseText}`,
      );
      throw new BadGatewayException('La génération de cards a échoué');
    }

    return cards;
  }

  // Contrairement à evaluate/translate/generateCards, cet appel n'est jamais
  // bloquant pour l'utilisateur : en cas d'absence de clé ou d'échec, on
  // retourne null et c'est à l'appelant (DashboardService) de décider du
  // message de repli, sans jamais faire échouer le chargement du dashboard.
  async generateDashboardMessage(
    summary: DashboardActivitySummaryInput,
  ): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }

    try {
      const response = await this.getClient(apiKey).models.generateContent({
        model: GEMINI_MODEL,
        contents: buildDashboardMessagePrompt(summary),
        config: { responseMimeType: 'application/json' },
      });

      const message = this.parseDashboardMessage(response.text);
      if (!message) {
        this.logger.error(
          `Réponse Gemini mal formée pour le message du dashboard : ${response.text}`,
        );
      }
      return message;
    } catch (err) {
      this.logger.error(
        'Appel Gemini échoué pour le message du dashboard',
        err instanceof Error ? err.stack : String(err),
      );
      return null;
    }
  }

  private parseDashboardMessage(text: string | undefined): string | null {
    if (!text) return null;

    try {
      const parsed = JSON.parse(text) as { message?: unknown };
      if (
        typeof parsed.message === 'string' &&
        parsed.message.trim().length > 0
      ) {
        return parsed.message.trim();
      }
      return null;
    } catch {
      return null;
    }
  }

  private getClient(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey });
  }

  private parseEvaluation(text: string | undefined): AiEvaluationResult | null {
    if (!text) return null;

    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const { verdict, cePointsForts, cePointsAmeliorer, piste, resumeCourt } =
        parsed;

      if (
        typeof verdict !== 'string' ||
        !VALID_VERDICTS.includes(verdict as AiVerdict)
      ) {
        return null;
      }

      const isNullableString = (value: unknown) =>
        value === null || value === undefined || typeof value === 'string';
      if (
        !isNullableString(cePointsForts) ||
        !isNullableString(cePointsAmeliorer) ||
        !isNullableString(piste) ||
        !isNullableString(resumeCourt)
      ) {
        return null;
      }

      return {
        verdict: verdict as AiVerdict,
        cePointsForts: (cePointsForts as string | null) ?? null,
        cePointsAmeliorer: (cePointsAmeliorer as string | null) ?? null,
        piste: (piste as string | null) ?? null,
        resumeCourt: (resumeCourt as string | null) ?? null,
      };
    } catch {
      return null;
    }
  }

  private parseTranslation(text: string | undefined): string | null {
    if (!text) return null;

    try {
      const parsed = JSON.parse(text) as { translation?: unknown };
      if (
        typeof parsed.translation === 'string' &&
        parsed.translation.trim().length > 0
      ) {
        return parsed.translation;
      }
      return null;
    } catch {
      return null;
    }
  }

  private parseGeneratedCards(
    text: string | undefined,
  ): GeneratedCard[] | null {
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

  private fallbackEvaluate(
    referenceAnswer: string,
    userAnswer: string,
  ): AiEvaluationResult {
    const referenceWords = normalizeToWordSet(referenceAnswer);
    const userWords = normalizeToWordSet(userAnswer);

    if (referenceWords.size === 0 || userWords.size === 0) {
      return {
        verdict: 'incompris',
        cePointsForts: null,
        cePointsAmeliorer:
          'Aucune réponse exploitable à comparer à la réponse de référence.',
        piste: 'Reformule ta réponse avec tes propres mots, même incomplète.',
        resumeCourt: 'réponse à reformuler',
      };
    }

    const overlap = [...referenceWords].filter((word) =>
      userWords.has(word),
    ).length;
    const overlapRatio = overlap / referenceWords.size;

    if (overlapRatio >= 0.6) {
      return {
        verdict: 'compris',
        cePointsForts: null,
        cePointsAmeliorer: null,
        piste: null,
        resumeCourt: null,
      };
    }
    if (overlapRatio >= 0.3) {
      return {
        verdict: 'partiellement',
        cePointsForts: 'Ta réponse couvre une partie des éléments attendus.',
        cePointsAmeliorer:
          'Certains éléments de la réponse de référence manquent encore.',
        piste:
          'Compare ta réponse à la réponse de référence pour repérer ce qui manque.',
        resumeCourt: 'éléments manquants à combler',
      };
    }
    return {
      verdict: 'incompris',
      cePointsForts: null,
      cePointsAmeliorer:
        'Ta réponse ne correspond pas à la réponse de référence.',
      piste:
        'Relis la réponse de référence et reformule-la avec tes propres mots.',
      resumeCourt: 'relecture de la référence',
    };
  }
}
