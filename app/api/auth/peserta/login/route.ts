import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LoginPesertaSchema } from '@/lib/validation';
import { comparePassword } from '@/lib/auth/password';
import { signJWT, PESERTA_COOKIE_NAME } from '@/lib/auth/session';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/auth/rateLimit';

const PESAN_GAGAL = 'Username atau Password tidak sesuai. Periksa kembali data Anda.';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const validation = LoginPesertaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ status: 'error', message: PESAN_GAGAL }, { status: 401 });
    }

    const { username, password } = validation.data;
    const usernameClean = username.trim().toLowerCase();
    const rateLimitKey = `peserta_${usernameClean}`;

    // 1. Cek Rate Limit
    const rateLimitCheck = await checkRateLimit(rateLimitKey);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ status: 'error', message: rateLimitCheck.message }, { status: 429 });
    }

    // 2. Cari peserta di PostgreSQL (bisa via username atau idPeserta)
    const peserta = await prisma.peserta.findFirst({
      where: {
        OR: [
          { username: usernameClean },
          { idPeserta: { equals: usernameClean, mode: 'insensitive' } },
        ],
      },
    });

    if (!peserta || !peserta.passwordHash) {
      await recordFailedAttempt(rateLimitKey);
      return NextResponse.json({ status: 'error', message: PESAN_GAGAL }, { status: 401 });
    }

    // 3. Bandingkan password dengan bcrypt
    const match = await comparePassword(password, peserta.passwordHash);
    if (!match) {
      const failRec = await recordFailedAttempt(rateLimitKey);
      if (failRec.locked) {
        return NextResponse.json(
          { status: 'error', message: 'Terlalu banyak percobaan gagal. Akses dikunci sementara. Silakan tunggu 15 menit.' },
          { status: 429 }
        );
      }
      return NextResponse.json({ status: 'error', message: PESAN_GAGAL }, { status: 401 });
    }

    // Berhasil login: reset hitungan rate limit
    await resetRateLimit(rateLimitKey);

    // 4. Buat JWT sesi
    const token = await signJWT({
      role: 'peserta',
      idPeserta: peserta.idPeserta,
      nama: peserta.namaLengkap,
      unit: peserta.asalSekolah,
      username: peserta.username || peserta.idPeserta,
    });

    const wajibGanti = peserta.statusPassword === 'Wajib Ganti';

    // 5. Susun respons (tanpa passwordHash!)
    const response = NextResponse.json({
      status: 'success',
      wajibGantiPassword: wajibGanti,
      data: {
        id: peserta.idPeserta,
        nama: peserta.namaLengkap,
        jk: peserta.jenisKelamin,
        unit: peserta.asalSekolah,
        partisipasi: peserta.partisipasi,
        waktuBerangkat: peserta.waktuBerangkat ? peserta.waktuBerangkat.toISOString() : '',
        waktuPulang: peserta.waktuPulang ? peserta.waktuPulang.toISOString() : '',
      },
    });

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: PESERTA_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 hari
    });

    return response;
  } catch (error) {
    console.error('Error saat login peserta:', error);
    return NextResponse.json({ status: 'error', message: 'Terjadi kesalahan sistem saat memuat data peserta.' }, { status: 500 });
  }
}
