import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { signToken, SESSION_COOKIE } from '../../../lib/api/auth.js';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../../lib/auth/rateLimit.js';
import { LoginPanitiaSchema } from '../../../lib/validation/index.js';
import { logSystem } from '../../../lib/logger.js';
import { prisma } from '../../../lib/prisma.js';

// Cookie bersifat Secure hanya di production (HTTPS) — biarkan bekerja di localhost HTTP
const isProduction = process.env.NODE_ENV === 'production';

/** Helper: set HttpOnly session cookie dan return JSON sukses */
function setCookieAndRespond(
  res: VercelResponse,
  token: string,
  panitiaRole: string,
  username: string
) {
  const cookieFlags = [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${12 * 60 * 60}`,
    'SameSite=Strict',
    ...(isProduction ? ['Secure'] : []),
  ].join('; ');
  res.setHeader('Set-Cookie', cookieFlags);
  // panitiaRole & username disertakan di body sehingga frontend bisa baca
  // tanpa harus decode HttpOnly cookie
  return res.status(200).json({ success: true, message: 'Login panitia berhasil', panitiaRole, username });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `panitia_login_${ip}`;

  try {
    // Periksa apakah IP ini sedang dalam status terkunci
    const rateLimitCheck = await checkRateLimit(rateLimitKey);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ error: rateLimitCheck.message });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATH C: Google ID Token (Tahap 2) — deteksi sebelum validasi username/password
    // Aktif hanya jika env GOOGLE_CLIENT_ID & SUPER_ADMIN_EMAIL tersedia.
    // Jika env tidak ada → 503 graceful (tidak crash).
    // ─────────────────────────────────────────────────────────────────────────
    if (req.body?.googleIdToken) {
      const { googleIdToken } = req.body;
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.SUPER_ADMIN_EMAIL) {
        return res.status(503).json({ error: 'Google Login belum dikonfigurasi oleh administrator.' });
      }
      try {
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: googleIdToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) throw new Error('INVALID_GOOGLE_TOKEN');

        if (!payload.email_verified) {
          return res.status(401).json({ error: 'Email Google belum diverifikasi.' });
        }
        if (payload.email !== process.env.SUPER_ADMIN_EMAIL) {
          logSystem({
            level: 'WARN',
            action: 'PANITIA_LOGIN_FAILED',
            details: { reason: 'google_email_not_allowed', email: payload.email },
            ipAddress: ip,
          });
          return res.status(401).json({ error: 'Akun Google ini tidak memiliki akses ke sistem panitia.' });
        }

        await resetRateLimit(rateLimitKey);

        const akunDb = await prisma.panitia.upsert({
          where: { username: payload.email },
          update: { aktif: true, role: 'SUPER_ADMIN' },
          create: {
            username: payload.email,
            passwordHash: '-', // akun Google OAuth
            namaLengkap: payload.name || 'Super Admin (Google)',
            role: 'SUPER_ADMIN',
            aktif: true,
          },
        });

        const token = await signToken(
          {
            role: 'panitia',
            panitiaId: akunDb.id,
            username: payload.email,
            panitiaRole: 'SUPER_ADMIN' as const,
            mobil: null,
          },
          'panitia'
        );

        logSystem({
          level: 'INFO',
          action: 'PANITIA_LOGIN_SUCCESS',
          details: { username: payload.email, role: 'SUPER_ADMIN', via: 'google' },
          ipAddress: ip,
        });

        return setCookieAndRespond(res, token, 'SUPER_ADMIN', payload.email!);
      } catch (err: any) {
        if (err?.message !== 'INVALID_GOOGLE_TOKEN') {
          console.error('Google token verification failed:', err);
        }
        const { locked } = await recordFailedAttempt(rateLimitKey);
        if (locked) {
          logSystem({ level: 'CRITICAL', action: 'PANITIA_LOGIN_LOCKED', ipAddress: ip });
          return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
        }
        return res.status(401).json({ error: 'Token Google tidak valid atau telah kadaluarsa.' });
      }
    }

    // PATH C selesai — lanjut ke username/password: validasi Zod dulu
    const parseResult = LoginPanitiaSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Username dan password wajib diisi';
      return res.status(400).json({ error: errorMsg });
    }
    const { username, password } = req.body as { username: string; password: string };

    // ─────────────────────────────────────────────────────────────────────────
    // PATH A: Cek tabel Panitia terlebih dahulu (sistem baru, Tahap 1)
    // ─────────────────────────────────────────────────────────────────────────
    const akun = await prisma.panitia.findUnique({ where: { username } });

    if (akun) {
      // Akun ditemukan di tabel Panitia — gunakan hash dari DB
      if (!akun.aktif) {
        // Akun dinonaktifkan — tolak tanpa hint lebih lanjut
        const { locked } = await recordFailedAttempt(rateLimitKey);
        if (locked) {
          logSystem({ level: 'CRITICAL', action: 'PANITIA_LOGIN_LOCKED', ipAddress: ip });
          return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
        }
        logSystem({
          level: 'WARN',
          action: 'PANITIA_LOGIN_FAILED',
          details: { reason: 'account_inactive', username },
          ipAddress: ip,
        });
        return res.status(401).json({ error: 'Kredensial tidak valid' });
      }

      const isValid = await bcrypt.compare(password, akun.passwordHash);
      if (!isValid) {
        const { locked } = await recordFailedAttempt(rateLimitKey);
        if (locked) {
          logSystem({ level: 'CRITICAL', action: 'PANITIA_LOGIN_LOCKED', ipAddress: ip });
          return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
        }
        logSystem({
          level: 'WARN',
          action: 'PANITIA_LOGIN_FAILED',
          details: { reason: 'invalid_password', username },
          ipAddress: ip,
        });
        return res.status(401).json({ error: 'Kredensial tidak valid' });
      }

      // Login via tabel Panitia berhasil
      await resetRateLimit(rateLimitKey);
      const token = await signToken(
        {
          role: 'panitia',
          panitiaId: akun.id,
          username: akun.username,
          panitiaRole: akun.role,
          mobil: akun.mobil ?? null,
        },
        'panitia'
      );

      logSystem({
        level: 'INFO',
        action: 'PANITIA_LOGIN_SUCCESS',
        actorId: akun.id,
        details: { username: akun.username, role: akun.role, via: 'db' },
        ipAddress: ip,
      });

      return setCookieAndRespond(res, token, akun.role, akun.username);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Akun tidak ditemukan di tabel Panitia — tolak.
    // CATATAN (revisi keamanan): Fallback env-var (PANITIA_USERNAME /
    // PANITIA_PASSWORD_HASH) telah DIHAPUS. Login panitia kini hanya lewat
    // tabel Panitia (atau Google Sign-In Super Admin di atas). PRASYARAT
    // DEPLOY: pastikan minimal 1 akun SUPER_ADMIN aktif di tabel Panitia
    // (`npm run migrate:admin`), atau SUPER_ADMIN_EMAIL + GOOGLE_CLIENT_ID
    // sudah diset agar login Google berfungsi.
    // ─────────────────────────────────────────────────────────────────────────
    const { locked } = await recordFailedAttempt(rateLimitKey);
    if (locked) {
      logSystem({ level: 'CRITICAL', action: 'PANITIA_LOGIN_LOCKED', ipAddress: ip });
      return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
    }
    logSystem({
      level: 'WARN',
      action: 'PANITIA_LOGIN_FAILED',
      details: { reason: 'account_not_found', username },
      ipAddress: ip,
    });
    return res.status(401).json({ error: 'Kredensial tidak valid' });
  } catch (error) {
    console.error('Panitia login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}