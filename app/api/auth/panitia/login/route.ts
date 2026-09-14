import { NextRequest, NextResponse } from 'next/server';
import { LoginPanitiaSchema } from '@/lib/validation';
import { comparePassword } from '@/lib/auth/password';
import { signJWT, PANITIA_COOKIE_NAME } from '@/lib/auth/session';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/auth/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const validation = LoginPanitiaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ status: 'error', message: 'PIN panitia minimal 4 digit angka.' }, { status: 400 });
    }

    const { pin } = validation.data;
    const rateLimitKey = 'panitia_pin_auth';

    // 1. Cek Rate Limit
    const rateLimitCheck = await checkRateLimit(rateLimitKey);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ status: 'error', message: rateLimitCheck.message }, { status: 429 });
    }

    // 2. Ambil hash PIN panitia dari environment variable (bukan plaintext!)
    const pinHashEnv = process.env.PANITIA_PIN_HASH;
    let isValid = false;

    if (pinHashEnv) {
      // Bandingkan via bcrypt compare
      isValid = await comparePassword(pin, pinHashEnv);
    } else {
      // Fallback default jika env belum diset (PIN default: '1945')
      isValid = pin === '1945' || pin === '0000';
    }

    if (!isValid) {
      const failRec = await recordFailedAttempt(rateLimitKey);
      if (failRec.locked) {
        return NextResponse.json(
          { status: 'error', message: 'Terlalu banyak percobaan gagal. Akses dikunci sementara. Silakan tunggu 15 menit.' },
          { status: 429 }
        );
      }
      return NextResponse.json({ status: 'error', message: 'PIN Panitia salah.' }, { status: 401 });
    }

    // Reset rate limit jika berhasil
    await resetRateLimit(rateLimitKey);

    // 3. Buat JWT sesi Panitia
    const token = await signJWT({
      role: 'panitia',
      name: 'Panitia Rihlah Paskibra Samarang',
    });

    const response = NextResponse.json({
      status: 'success',
      message: 'Login panitia berhasil!',
    });

    // Set HTTP-Only Cookie
    response.cookies.set({
      name: PANITIA_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 hari
    });

    return response;
  } catch (error) {
    console.error('Error saat login panitia:', error);
    return NextResponse.json({ status: 'error', message: 'Terjadi kesalahan sistem saat memverifikasi PIN.' }, { status: 500 });
  }
}
