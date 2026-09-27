/**
 * Server-to-server proof that a request came from the Hive admin proxy.
 *
 * Header:  X-Hive-Auth: <unix-seconds>.<hex hmac-sha256>
 * Signed:  `${ts}:${METHOD}:${pathname}` with HIVE_ADMIN_SECRET
 * Window:  +-5 minutes, so a captured header cannot be replayed later.
 *
 * Uses Web Crypto only, so it runs in the Edge middleware, in Node route
 * handlers, and in Hive. Pure, unit-testable.
 */
export const HIVE_SIG_WINDOW_SEC = 300

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('')
}

export async function signHiveRequest(secret: string, method: string, pathname: string, nowSec = Math.floor(Date.now() / 1000)): Promise<string> {
  const ts = String(nowSec)
  return `${ts}.${await hmacHex(secret, `${ts}:${method.toUpperCase()}:${pathname}`)}`
}

export async function verifyHiveSignature(header: string | null | undefined, secret: string | undefined, method: string, pathname: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!header || !secret) return false
  const dot = header.indexOf('.')
  if (dot <= 0) return false
  const ts = Number(header.slice(0, dot)); const mac = header.slice(dot + 1)
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > HIVE_SIG_WINDOW_SEC) return false
  const expected = await hmacHex(secret, `${ts}:${method.toUpperCase()}:${pathname}`)
  return safeEqual(mac, expected)
}

/** Constant-time string compare: no early exit on content; false on type or length mismatch. */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ba = new TextEncoder().encode(a), bb = new TextEncoder().encode(b)
  if (ba.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i]
  return diff === 0
}
