export const AI_THROTTLE = { default: { limit: 15, ttl: 60000 } };

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Aligné sur le quota gratuit réel de Gemini pour gemini-2.5-flash-preview-tts
// (10 requêtes/jour) : évite de gaspiller des appels si le front boucle ou spam.
export const AUDIO_THROTTLE = { default: { limit: 10, ttl: ONE_DAY_MS } };
