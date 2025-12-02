import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie } from 'h3'

type SessionRole = 'host' | 'guest'

export interface SessionData {
  id: string
  eventId: number
  role: SessionRole
  createdAt: number
}

const SESSION_COOKIE_NAME = 'gp_session'
const SESSION_TTL_MS = 60 * 60 * 1000 // 1 hour

// In-memory session store for MVP; in production we could move this to D1 if needed.
const sessions = new Map<string, SessionData>()

export function generateHostCode() {
  // High entropy code (32 chars, url-safe)
  return cryptoRandomId(32)
}

export function generateGuestCode() {
  // 6-char uppercase + numbers
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function createSession(event: H3Event, eventId: number, role: SessionRole): SessionData {
  const id = cryptoRandomId(24)
  const now = Date.now()
  const session: SessionData = {
    id,
    eventId,
    role,
    createdAt: now,
  }
  sessions.set(id, session)

  setCookie(event, SESSION_COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  })

  return session
}

export function getCodeSession(event: H3Event): SessionData | null {
  const id = getCookie(event, SESSION_COOKIE_NAME)
  if (!id) return null

  const session = sessions.get(id)
  if (!session) return null

  const now = Date.now()
  if (now - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(id)
    deleteCookie(event, SESSION_COOKIE_NAME)
    return null
  }

  return session
}

export function requireSession(event: H3Event): SessionData {
  const session = getCodeSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Session expired or missing' })
  }
  return session
}

export function clearCodeSession(event: H3Event) {
  const id = getCookie(event, SESSION_COOKIE_NAME)
  if (id) {
    sessions.delete(id)
  }
  deleteCookie(event, SESSION_COOKIE_NAME)
}

function cryptoRandomId(length: number) {
  const cryptoObj = globalThis.crypto
  if (!cryptoObj) {
    // Fallback: Math.random-based (only if crypto unavailable; unlikely in Nitro)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    let out = ''
    for (let i = 0; i < length; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return out
  }

  const bytes = new Uint8Array(length)
  cryptoObj.getRandomValues(bytes)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}


