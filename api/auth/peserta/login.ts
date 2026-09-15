import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../lib/prisma';
import { signToken, SESSION_COOKIE } from '../../../lib/api/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../../lib/auth/rateLimit';
import { LoginPesertaSchema } from '../../../lib/validation';

// Cookie bersifat Secure hanya di production (HTTPS)
const isProduction = process.env.NODE_ENV === 'production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const parseResult = LoginPesertaSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors[0]?.message || 'Username dan password wajib diisi';
    return res.status(400).json({ error: errorMsg });
  }

  const { username, password } = req.body;

  // Rate limit per-IP dan per-username untuk cegah credential stuffing
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  const ipKey = `peserta_login_ip_${ip}`;
  const usernameKey = `peserta_login_user_${username}`;

  try {
    // Cek lock berdasarkan IP dan username (keduanya harus lolos)
    const [ipCheck, userCheck] = await Promise.all([
      checkRateLimit(ipKey),
      checkRateLimit(usernameKey),
    ]);

    if (!ipCheck.allowed || !userCheck.allowed) {
      return res.status(429).json({ error: ipCheck.message || userCheck.message });
    }

    const peserta = await prisma.peserta.findUnique({ where: { username } });
    if (!peserta || !peserta.passwordHash) {
      // Catat kegagalan pada kedua key
      await Promise.all([recordFailedAttempt(ipKey), recordFailedAttempt(usernameKey)]);
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }

    const isValid = await bcrypt.compare(password, peserta.passwordHash);
    if (!isValid) {
      const [ipResult] = await Promise.all([
        recordFailedAttempt(ipKey),
        recordFailedAttempt(usernameKey),
      ]);
      if (ipResult.locked) {
        return res.status(429).json({ error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' });
      }
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }

    // Login berhasil — reset counter
    await Promise.all([resetRateLimit(ipKey), resetRateLimit(usernameKey)]);

    const token = await signToken({ id: peserta.id, idPeserta: peserta.idPeserta, role: 'peserta' }, 'peserta');

    const cookieFlags = [
      `${SESSION_COOKIE}=${token}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${24 * 60 * 60}`,
      'SameSite=Strict',
      ...(isProduction ? ['Secure'] : []),
    ].join('; ');

    res.setHeader('Set-Cookie', cookieFlags);
    return res.status(200).json({
      success: true,
      data: {
        idPeserta: peserta.idPeserta,
        namaLengkap: peserta.namaLengkap,
        statusPassword: peserta.statusPassword,
      },
    });
  } catch (error) {
    console.error('Peserta login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

