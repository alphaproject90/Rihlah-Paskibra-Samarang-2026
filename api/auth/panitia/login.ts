import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { signToken, SESSION_COOKIE } from '../../../lib/api/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../../lib/auth/rateLimit';
import { LoginPanitiaSchema } from '../../../lib/validation';

// Cookie bersifat Secure hanya di production (HTTPS) — biarkan bekerja di localhost HTTP
const isProduction = process.env.NODE_ENV === 'production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!process.env.PANITIA_USERNAME || !process.env.PANITIA_PASSWORD_HASH) {
    return res.status(500).json({ error: 'Server misconfiguration: Credentials missing.' });
  }

  const parseResult = LoginPanitiaSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || 'Username dan password wajib diisi';
    return res.status(400).json({ error: errorMsg });
  }

  const { username, password } = req.body;

  // Gunakan IP sebagai key rate limit — fallback ke 'unknown' jika tidak tersedia
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `panitia_login_${ip}`;

  try {
    // Periksa apakah IP ini sedang dalam status terkunci
    const rateLimitCheck = await checkRateLimit(rateLimitKey);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ error: rateLimitCheck.message });
    }

    if (username !== process.env.PANITIA_USERNAME) {
      await recordFailedAttempt(rateLimitKey);
      // Pesan generik — jangan beritahu apakah username atau password yang salah
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }

    const isValid = await bcrypt.compare(password, process.env.PANITIA_PASSWORD_HASH);
    if (!isValid) {
      const { locked } = await recordFailedAttempt(rateLimitKey);
      if (locked) {
        return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
      }
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }

    // Login berhasil — reset counter dan buat sesi
    await resetRateLimit(rateLimitKey);
    const token = await signToken({ role: 'panitia' }, 'panitia');

    const cookieFlags = [
      `${SESSION_COOKIE}=${token}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${12 * 60 * 60}`,
      'SameSite=Strict',
      ...(isProduction ? ['Secure'] : []),
    ].join('; ');

    res.setHeader('Set-Cookie', cookieFlags);
    return res.status(200).json({ success: true, message: 'Login panitia berhasil' });
  } catch (error) {
    console.error('Panitia login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}