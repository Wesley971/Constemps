import { Request } from 'express';

export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export function extractRefreshTokenFromCookie(req: Request): string | null {
  const cookies = req?.cookies as Record<string, string> | undefined;
  return cookies?.[REFRESH_TOKEN_COOKIE] ?? null;
}
