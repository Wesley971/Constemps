import type { User } from '../types/user'
import type { Deck } from '../types/deck'
import type { Card, CardType } from '../types/card'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const message = Array.isArray(body?.message) ? body.message.join(', ') : (body?.message ?? 'Request failed')
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

export const authApi = {
  register: (email: string, password: string) =>
    request<User>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<User>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => request<User>('/auth/me'),
}

export const decksApi = {
  list: () => request<Deck[]>('/decks'),
  get: (id: string) => request<Deck>(`/decks/${id}`),
  create: (name: string) => request<Deck>('/decks', { method: 'POST', body: JSON.stringify({ name }) }),
  remove: (id: string) => request<{ success: boolean }>(`/decks/${id}`, { method: 'DELETE' }),
}

export const cardsApi = {
  list: (deckId: string) => request<Card[]>(`/decks/${deckId}/cards`),
  create: (deckId: string, type: CardType, front: string, back: string) =>
    request<Card>(`/decks/${deckId}/cards`, { method: 'POST', body: JSON.stringify({ type, front, back }) }),
  update: (id: string, front: string, back: string) =>
    request<Card>(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify({ front, back }) }),
  remove: (id: string) => request<{ success: boolean }>(`/cards/${id}`, { method: 'DELETE' }),
}
