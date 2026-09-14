import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET_RAW = process.env.JWT_SECRET || 'rihlah-paskibra-samarang-jwt-secret-key-32-chars-long!';
const JWT_KEY = new TextEncoder().encode(JWT_SECRET_RAW);

export interface PesertaSessionPayload {
  role: 'peserta';
  idPeserta: string;
  nama: string;
  unit: string;
  username: string;
}

export interface PanitiaSessionPayload {
  role: 'panitia';
  name: string;
}

export type SessionPayload = PesertaSessionPayload | PanitiaSessionPayload;

export const PESERTA_COOKIE_NAME = 'rihlah_peserta_token';
export const PANITIA_COOKIE_NAME = 'rihlah_panitia_token';

/**
 * Tandatangani JWT token dengan payload dan masa berlaku
 */
export async function signJWT(payload: SessionPayload, expiresIn = '24h'): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_KEY);
}

/**
 * Verifikasi keabsahan JWT token
 */
export async function verifyJWT<T extends SessionPayload = SessionPayload>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_KEY, {
      algorithms: ['HS256'],
    });
    return payload as unknown as T;
  } catch {
    return null;
  }
}

/**
 * Mengambil sesi peserta dari cookies
 */
export async function getPesertaSession(): Promise<PesertaSessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(PESERTA_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyJWT<PesertaSessionPayload>(token);
  } catch {
    return null;
  }
}

/**
 * Mengambil sesi panitia dari cookies
 */
export async function getPanitiaSession(): Promise<PanitiaSessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(PANITIA_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyJWT<PanitiaSessionPayload>(token);
  } catch {
    return null;
  }
}

/**
 * Memvalidasi sesi dari NextRequest (baik lewat Cookie maupun header Authorization: Bearer)
 */
export async function verifyRequestSession(req: NextRequest, roleRequired?: 'peserta' | 'panitia') {
  let token = req.cookies.get(roleRequired === 'panitia' ? PANITIA_COOKIE_NAME : PESERTA_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // Jika tidak ditemukan di cookie spesifik, cek cookie alternatif
  if (!token) {
    token = req.cookies.get(PANITIA_COOKIE_NAME)?.value || req.cookies.get(PESERTA_COOKIE_NAME)?.value;
  }

  if (!token) return null;
  const verified = await verifyJWT(token);
  if (!verified) return null;

  if (roleRequired && verified.role !== roleRequired) {
    return null;
  }
  return verified;
}
