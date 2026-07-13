import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

interface DeepLTranslateResponse {
  translations: { detected_source_language: string; text: string }[];
}

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  async translate(text: string, targetLang: string): Promise<string> {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('Service de traduction non configuré');
    }

    const baseUrl = apiKey.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/v2/translate`, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: [text], target_lang: targetLang }),
      });
    } catch (err) {
      this.logger.error('DeepL request failed', err instanceof Error ? err.stack : String(err));
      throw new BadGatewayException('Impossible de contacter le service de traduction');
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(`DeepL API error ${response.status}: ${errorBody}`);
      throw new BadGatewayException('La traduction a échoué');
    }

    const data = (await response.json()) as DeepLTranslateResponse;
    const translation = data.translations?.[0]?.text;
    if (!translation) {
      this.logger.error(`DeepL API returned no translation: ${JSON.stringify(data)}`);
      throw new BadGatewayException('La traduction a échoué');
    }

    return translation;
  }
}
