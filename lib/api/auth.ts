import { SignJWT, jwtVerify } from 'jose';
import type { VercelRequest } from '@vercel/node';

// ⚠️ SECURITY FIX #4 (Tahap 1, dipertahankan): fail-fast kalau JWT_SECRET tidak diset.
// Catatan penting untuk lingkungan serverless: berbeda dengan server.ts (satu proses
// panjang yang langsung crash total saat start kalau env kosong), di Vercel setiap
// function di-bundle terpisah. Guard ini akan melempar error saat cold start pertama
// kali function yang meng-import modul ini dipanggil (bukan saat "server nyala"),
// dan HANYA memengaruhi function yang benar-benar mengimpor modul ini (yang butuh
// sesi/JWT). Endpoint yang tidak butuh auth (mis. /api/health) tidak terpengaruh.
if (!process.env.JWT_SECRET) {
  throw new Error(
    '❌ FATAL: JWT_SECRET environment variable is required. Set it in .env or your deployment platform.'
  );
}

const JWT_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export const PESERTA_COOKIE = 'rihlah_peserta_token';
export const PANITIA_COOKIE = 'rihlah_panitia_token';

export async function signToken(payload: Record<string, unknown>, expiresIn = '24h'): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_KEY);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_KEY);
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((c) => {
    const idx = c.indexOf('=');
    if (idx > -1) {
      const k = c.substring(0, idx).trim();
      const v = c.substring(idx + 1).trim();
      cookies[k] = decodeURIComponent(v);
    }
  });
  return cookies;
}

/**
 * Persis logika getSession() di server.ts: cari cookie sesuai role yang diminta,
 * fallback ke Authorization: Bearer, lalu fallback ke cookie role lain mana pun ada.
 */
export function getSessionToken(req: VercelRequest, requiredRole?: 'peserta' | 'panitia'): string | undefined {
  const cookies = parseCookies(req.headers.cookie);
  let token = requiredRole === 'panitia' ? cookies[PANITIA_COOKIE] : cookies[PESERTA_COOKIE];

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    token = cookies[PANITIA_COOKIE] || cookies[PESERTA_COOKIE];
  }

  return token;
}

export async function getSession(req: VercelRequest, requiredRole?: 'peserta' | 'panitia') {
  const token = getSessionToken(req, requiredRole);
  return token ? await verifyToken(token) : null;
}

export function setCookie(res: import('@vercel/node').VercelResponse, name: string, value: string, maxAgeSeconds: number) {
  res.setHeader('Set-Cookie', `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`);
}

export function clearAuthCookies(res: import('@vercel/node').VercelResponse) {
  res.setHeader('Set-Cookie', [
    `${PESERTA_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `${PANITIA_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ]);
}
