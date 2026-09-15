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

export const SESSION_COOKIE = 'rihlah_session_token';

export async function signToken(
  payload: Record<string, unknown>,
  expiresInOrRole: string | 'panitia' | 'peserta' = '24h'
): Promise<string> {
  const isRole = expiresInOrRole === 'panitia' || expiresInOrRole === 'peserta';
  const role = isRole ? expiresInOrRole : (payload.role as string | undefined);
  const expiresIn = isRole ? (expiresInOrRole === 'panitia' ? '12h' : '24h') : expiresInOrRole;

  const finalPayload = role ? { ...payload, role } : payload;

  return await new SignJWT(finalPayload)
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
 * Logika baku getSessionToken: cari cookie baku rihlah_session_token,
 * fallback ke legacy cookies, lalu fallback ke Authorization: Bearer.
 */
export function getSessionToken(req: VercelRequest, requiredRole?: 'peserta' | 'panitia'): string | undefined {
  const cookies = parseCookies(req.headers.cookie);

  // 1. Cek cookie baku rihlah_session_token terlebih dahulu
  let token = cookies[SESSION_COOKIE];

  // 2. Fallback ke nama cookie legacy jika ada sesi lama yang belum logout
  if (!token) {
    if (requiredRole === 'panitia') {
      token = cookies['rihlah_panitia_token'] || cookies['panitia_token'];
    } else if (requiredRole === 'peserta') {
      token = cookies['rihlah_peserta_token'] || cookies['peserta_token'];
    }
  }

  // 3. Fallback ke Authorization: Bearer
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // 4. Fallback ke cookie apa pun yang tersedia
  if (!token) {
    token =
      cookies[SESSION_COOKIE] ||
      cookies['rihlah_panitia_token'] ||
      cookies['rihlah_peserta_token'] ||
      cookies['panitia_token'] ||
      cookies['peserta_token'];
  }

  return token;
}

export async function getSession(req: VercelRequest, requiredRole?: 'peserta' | 'panitia') {
  const token = getSessionToken(req, requiredRole);
  return token ? await verifyToken(token) : null;
}

export function setCookie(res: import('@vercel/node').VercelResponse, name: string, value: string, maxAgeSeconds: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${
      isProduction ? '; Secure' : ''
    }`
  );
}

export function clearAuthCookies(res: import('@vercel/node').VercelResponse) {
  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
    'rihlah_peserta_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    'rihlah_panitia_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    'peserta_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    'panitia_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
  ]);
}
