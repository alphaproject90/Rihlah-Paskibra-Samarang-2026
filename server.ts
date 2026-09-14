import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { createServer as createViteServer } from 'vite';
import {
  RegisterPesertaSchema,
  LoginPesertaSchema,
  GantiPasswordPesertaSchema,
  LoginPanitiaSchema,
  ScanQrSchema,
  PHONE_REGEX,
  USERNAME_REGEX,
  STRONG_PASSWORD_REGEX,
} from './lib/validation';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from './lib/auth/rateLimit';

// Pastikan PostgreSQL aktif di background
try {
  execSync('pg_isready -h localhost -p 5432 -q');
} catch {
  try {
    console.log('Memulai PostgreSQL di /tmp/pgdata...');
    execSync('su - postgres -c "pg_ctl -D /tmp/pgdata -l /tmp/pgdata/logfile start"');
  } catch (e) {
    console.warn('Gagal otomatis menjalankan PostgreSQL:', e);
  }
}

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

const app = express();
const PORT = 3000;

// ⚠️ SECURITY FIX #4: Fail-fast if JWT_SECRET is not configured
if (!process.env.JWT_SECRET) {
  throw new Error('❌ FATAL: JWT_SECRET environment variable is required. Set it in .env or your deployment platform.');
}
const JWT_SECRET_RAW = process.env.JWT_SECRET;
const JWT_KEY = new TextEncoder().encode(JWT_SECRET_RAW);
const PESERTA_COOKIE = 'rihlah_peserta_token';
const PANITIA_COOKIE = 'rihlah_panitia_token';
const PESAN_GAGAL_LOGIN = 'Username atau Password tidak sesuai. Periksa kembali data Anda.';

app.use(express.json({ limit: '10mb' }));

// Middleware parser cookies
app.use((req: Request, res: Response, next: NextFunction) => {
  const cookieHeader = req.headers.cookie;
  const cookies: Record<string, string> = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((c) => {
      const idx = c.indexOf('=');
      if (idx > -1) {
        const k = c.substring(0, idx).trim();
        const v = c.substring(idx + 1).trim();
        cookies[k] = decodeURIComponent(v);
      }
    });
  }
  (req as any).cookies = cookies;
  next();
});

// Helper JWT
async function signToken(payload: any, expiresIn = '24h') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_KEY);
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_KEY);
    return payload;
  } catch {
    return null;
  }
}

function getSession(req: Request, requiredRole?: 'peserta' | 'panitia') {
  const cookies = (req as any).cookies || {};
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

// -------------------------------------------------------------
// API ROUTES (Mengacu Dokumen Spesifikasi Migrasi Bagian 3)
// -------------------------------------------------------------

// 1. Health Check
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const count = await prisma.peserta.count();
    res.json({
      status: 'ok',
      event: 'Giat Rihlah Paskibra Samarang 2026',
      engine: 'PostgreSQL + Prisma ORM',
      totalPeserta: count,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message });
  }
});

// 2. GET /api/statistik
app.get('/api/statistik', async (req: Request, res: Response) => {
  try {
    const [totalIkut, totalTidakIkut, totalBerangkat, totalPulang] = await Promise.all([
      prisma.peserta.count({ where: { partisipasi: 'Ikut' } }),
      prisma.peserta.count({ where: { partisipasi: 'Tidak Ikut' } }),
      prisma.peserta.count({ where: { waktuBerangkat: { not: null } } }),
      prisma.peserta.count({ where: { waktuPulang: { not: null } } }),
    ]);

    res.json({
      status: 'success',
      total: totalIkut,
      tidakIkut: totalTidakIkut,
      berangkat: totalBerangkat,
      pulang: totalPulang,
    });
  } catch (err) {
    console.error('Error saat getStatistik:', err);
    res.status(500).json({ status: 'error', message: 'Gagal memuat statistik.' });
  }
});

// 3. GET /api/peserta (Proteksi Panitia, STRICTLY TANPA passwordHash)
app.get('/api/peserta', async (req: Request, res: Response) => {
  try {
    const token = getSession(req, 'panitia');
    const session = token ? await verifyToken(token) : null;

    // ⚠️ SECURITY FIX #1: Guard clause — tolak jika sesi tidak valid atau role bukan panitia
    if (!session || (session as any).role !== 'panitia') {
      res.status(401).json({ status: 'error', message: 'Akses ditolak. Sesi panitia tidak valid.' });
      return;
    }

    // Ambil data peserta dari PostgreSQL (kolom passwordHash tidak pernah di-serialize)
    const list = await prisma.peserta.findMany({
      select: {
        idPeserta: true,
        namaLengkap: true,
        jenisKelamin: true,
        asalSekolah: true,
        partisipasi: true,
        alasanTidakIkut: true,
        waPribadi: true,
        waDarurat: true,
        riwayatMedis: true,
        waktuBerangkat: true,
        waktuPulang: true,
        username: true,
        statusPassword: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = list.map((p) => ({
      id: p.idPeserta,
      nama: p.namaLengkap,
      jk: p.jenisKelamin,
      unit: p.asalSekolah,
      partisipasi: p.partisipasi,
      alasan: p.alasanTidakIkut || '',
      waPeserta: p.waPribadi || '',
      waDarurat: p.waDarurat || '',
      medis: p.riwayatMedis || '',
      waktuBerangkat: p.waktuBerangkat ? p.waktuBerangkat.toLocaleString('id-ID') : '',
      waktuPulang: p.waktuPulang ? p.waktuPulang.toLocaleString('id-ID') : '',
      username: p.username || '',
      statusPassword: p.statusPassword || 'Selesai',
    }));

    res.json({ status: 'success', data: formatted });
  } catch (err) {
    console.error('Error saat getPeserta:', err);
    res.status(500).json({ status: 'error', message: 'Gagal memuat data peserta.' });
  }
});

// 4. POST /api/peserta/register dan alias POST /api/register
const handleRegister = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.nama || !payload.unit) {
      res.status(400).json({ status: 'error', message: 'Data pendaftaran belum lengkap.' });
      return;
    }

    const isIkut = payload.partisipasi === 'Ikut';

    // Validasi server-side
    if (isIkut) {
      const waPeserta = (payload.waPeserta || '').toString().trim();
      const waDarurat = (payload.waDarurat || '').toString().trim();
      const usernameInput = (payload.username || '').toString().trim().toLowerCase();
      const passwordInput = (payload.password || '').toString();

      if (!PHONE_REGEX.test(waPeserta)) {
        res.json({
          status: 'error',
          message: 'Nomor WhatsApp Peserta tidak valid. Gunakan format nomor telepon yang benar (contoh: 08123456789).',
        });
        return;
      }
      if (!PHONE_REGEX.test(waDarurat)) {
        res.json({
          status: 'error',
          message: 'Nomor WhatsApp Darurat tidak valid. Gunakan format nomor telepon yang benar (contoh: 08123456789).',
        });
      }
      if (!USERNAME_REGEX.test(usernameInput)) {
        res.json({
          status: 'error',
          message: 'Username tidak valid. Gunakan 4-20 karakter huruf/angka/underscore tanpa spasi.',
        });
        return;
      }
      if (!STRONG_PASSWORD_REGEX.test(passwordInput)) {
        res.json({
          status: 'error',
          message: 'Password minimal 8 karakter dan harus kombinasi huruf besar, huruf kecil, angka, dan simbol.',
        });
        return;
      }
    } else {
      if (!payload.alasan || payload.alasan.trim().length < 3) {
        res.json({ status: 'error', message: 'Harap cantumkan alasan tidak mengikuti rihlah.' });
        return;
      }
    }

    // Transaksi Prisma mencegah race condition pendaftaran
    const created = await prisma.$transaction(async (tx) => {
      const usernameClean = isIkut && payload.username ? payload.username.trim().toLowerCase() : null;

      if (usernameClean) {
        const exist = await tx.peserta.findUnique({
          where: { username: usernameClean },
        });
        if (exist) {
          throw new Error('DUPLICATE_USERNAME');
        }
      }

      let idPeserta = '';
      if (isIkut) {
        const countIkut = await tx.peserta.count({ where: { partisipasi: 'Ikut' } });
        idPeserta = `PASK-${String(countIkut + 1).padStart(4, '0')}`;
        let exists = await tx.peserta.findUnique({ where: { idPeserta } });
        let offset = 1;
        while (exists) {
          idPeserta = `PASK-${String(countIkut + 1 + offset).padStart(4, '0')}`;
          exists = await tx.peserta.findUnique({ where: { idPeserta } });
          offset++;
        }
      } else {
        const countTidak = await tx.peserta.count({ where: { partisipasi: 'Tidak Ikut' } });
        idPeserta = `TIDAK-IKUT-${String(countTidak + 1).padStart(4, '0')}`;
      }

      // Hash password dengan bcrypt cost >= 10
      let passHash: string | null = null;
      if (isIkut && payload.password) {
        passHash = await bcrypt.hash(payload.password, 10);
      }

      const record = await tx.peserta.create({
        data: {
          idPeserta,
          namaLengkap: payload.nama.trim(),
          jenisKelamin: payload.jk || 'Laki-laki',
          asalSekolah: payload.unit.trim(),
          partisipasi: payload.partisipasi,
          alasanTidakIkut: isIkut ? null : payload.alasan?.trim(),
          waPribadi: isIkut ? payload.waPeserta?.trim() : null,
          waDarurat: isIkut ? payload.waDarurat?.trim() : null,
          riwayatMedis: isIkut ? (payload.medis?.trim() || '-') : null,
          username: usernameClean,
          passwordHash: passHash,
          statusPassword: isIkut ? 'Selesai' : null,
        },
      });

      return record;
    });

    res.json({
      status: 'success',
      id: created.idPeserta,
      message: 'Pendaftaran berhasil disimpan!',
    });
  } catch (err: any) {
    if (err?.message === 'DUPLICATE_USERNAME' || err?.code === 'P2002') {
      res.json({ status: 'error', message: 'Username sudah digunakan. Silakan pilih username lain.' });
      return;
    }
    console.error('Error pendaftaran peserta:', err);
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan sistem saat mendaftar.' });
  }
};

app.post('/api/peserta/register', handleRegister);
app.post('/api/register', handleRegister);

// 5. POST /api/auth/peserta/login dan alias POST /api/login-peserta
const handleLoginPeserta = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};
    const usernameClean = (username || '').toString().trim().toLowerCase();
    const passwordClean = (password || '').toString();

    if (!usernameClean || !passwordClean) {
      res.status(401).json({ status: 'error', message: PESAN_GAGAL_LOGIN });
      return;
    }

    const rateKey = `peserta_${usernameClean}`;
    const rateCheck = await checkRateLimit(rateKey);
    if (!rateCheck.allowed) {
      res.status(429).json({ status: 'error', message: rateCheck.message });
      return;
    }

    // Cari di database PostgreSQL
    const found = await prisma.peserta.findFirst({
      where: {
        OR: [
          { username: usernameClean },
          { idPeserta: { equals: usernameClean, mode: 'insensitive' } },
        ],
      },
    });

    if (!found || !found.passwordHash) {
      await recordFailedAttempt(rateKey);
      res.status(401).json({ status: 'error', message: PESAN_GAGAL_LOGIN });
      return;
    }

    const isMatch = await bcrypt.compare(passwordClean, found.passwordHash);
    if (!isMatch) {
      const failRec = await recordFailedAttempt(rateKey);
      if (failRec.locked) {
        res.status(429).json({
          status: 'error',
          message: 'Terlalu banyak percobaan gagal. Akses dikunci sementara. Silakan tunggu 15 menit.',
        });
        return;
      }
      res.status(401).json({ status: 'error', message: PESAN_GAGAL_LOGIN });
      return;
    }

    // Reset rate limit
    await resetRateLimit(rateKey);

    // Buat JWT Token
    const token = await signToken({
      role: 'peserta',
      idPeserta: found.idPeserta,
      nama: found.namaLengkap,
      unit: found.asalSekolah,
      username: found.username || found.idPeserta,
    });

    const isWajibGanti = found.statusPassword === 'Wajib Ganti';

    // Set cookie
    res.setHeader(
      'Set-Cookie',
      `${PESERTA_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );

    res.json({
      status: 'success',
      wajibGantiPassword: isWajibGanti,
      data: {
        id: found.idPeserta,
        nama: found.namaLengkap,
        jk: found.jenisKelamin,
        unit: found.asalSekolah,
        partisipasi: found.partisipasi,
        waktuBerangkat: found.waktuBerangkat ? found.waktuBerangkat.toISOString() : '',
        waktuPulang: found.waktuPulang ? found.waktuPulang.toISOString() : '',
      },
    });
  } catch (err) {
    console.error('Error saat login peserta:', err);
    res.status(500).json({ status: 'error', message: 'Terjadi kesalahan sistem saat memproses login.' });
  }
};

app.post('/api/auth/peserta/login', handleLoginPeserta);
app.post('/api/login-peserta', handleLoginPeserta);

// 6. POST /api/auth/peserta/ganti-password dan alias POST /api/ganti-password
const handleGantiPassword = async (req: Request, res: Response) => {
  try {
    const { identifier, username, noWa, oldPassword, newPassword } = req.body || {};
    const idTarget = (identifier || username || '').toString().trim().toLowerCase();
    const waInput = (noWa || '').toString().replace(/\D/g, '');
    const newPassStr = (newPassword || '').toString();

    if (!STRONG_PASSWORD_REGEX.test(newPassStr)) {
      res.json({
        status: 'error',
        message: 'Password baru minimal 8 karakter kombinasi huruf besar, kecil, angka, dan simbol.',
      });
      return;
    }

    // Periksa sesi peserta
    const token = getSession(req, 'peserta');
    const session = token ? await verifyToken(token) : null;

    // Transaksi Prisma mencegah race condition update password
    await prisma.$transaction(async (tx) => {
      let target = null;

      if (session && (session as any).idPeserta) {
        target = await tx.peserta.findUnique({
          where: { idPeserta: (session as any).idPeserta },
        });
      } else if (idTarget && waInput) {
        // Alur Lupa Password dengan verifikasi WhatsApp
        target = await tx.peserta.findFirst({
          where: {
            OR: [
              { username: idTarget },
              { idPeserta: { equals: idTarget, mode: 'insensitive' } },
            ],
          },
        });

        if (!target) throw new Error('NOT_FOUND');

        const dbWa = (target.waPribadi || '').replace(/\D/g, '');
        if (!dbWa || dbWa !== waInput) {
          throw new Error('WA_MISMATCH');
        }
      } else if (idTarget && oldPassword) {
        target = await tx.peserta.findFirst({
          where: {
            OR: [
              { username: idTarget },
              { idPeserta: { equals: idTarget, mode: 'insensitive' } },
            ],
          },
        });

        if (!target || !target.passwordHash) throw new Error('NOT_FOUND');

        const match = await bcrypt.compare(oldPassword, target.passwordHash);
        if (!match) throw new Error('WRONG_PASSWORD');
      } else {
        throw new Error('UNAUTHORIZED');
      }

      if (!target) throw new Error('NOT_FOUND');

      if (session && oldPassword && target.passwordHash) {
        const match = await bcrypt.compare(oldPassword, target.passwordHash);
        if (!match) throw new Error('WRONG_PASSWORD');
      }

      const newHashed = await bcrypt.hash(newPassStr, 10);
      await tx.peserta.update({
        where: { id: target.id },
        data: {
          passwordHash: newHashed,
          statusPassword: 'Selesai',
        },
      });
    });

    res.json({
      status: 'success',
      message: 'Password berhasil diperbarui! Silakan login kembali dengan password baru Anda.',
    });
  } catch (err: any) {
    if (err?.message === 'WRONG_PASSWORD') {
      res.json({ status: 'error', message: 'Password saat ini tidak sesuai.' });
      return;
    }
    if (err?.message === 'WA_MISMATCH') {
      res.json({ status: 'error', message: 'Nomor WhatsApp tidak cocok dengan data terdaftar peserta.' });
      return;
    }
    if (err?.message === 'NOT_FOUND') {
      res.json({ status: 'error', message: 'Akun dengan Username atau ID Peserta tersebut tidak ditemukan.' });
      return;
    }
    if (err?.message === 'UNAUTHORIZED') {
      res.json({ status: 'error', message: 'Nomor WhatsApp terdaftar diperlukan untuk verifikasi lupa password.' });
      return;
    }
    console.error('Error saat ganti password:', err);
    res.status(500).json({ status: 'error', message: 'Gagal memperbarui password.' });
  }
};

app.post('/api/auth/peserta/ganti-password', handleGantiPassword);
app.post('/api/ganti-password', handleGantiPassword);

// 7. POST /api/auth/panitia/login dan alias POST /api/verifikasi-pin
const handleLoginPanitia = async (req: Request, res: Response) => {
  try {
    const { pin } = req.body || {};
    const pinStr = (pin || '').toString().trim();

    if (!pinStr || pinStr.length < 4) {
      res.status(400).json({ status: 'error', message: 'PIN panitia minimal 4 digit angka.' });
      return;
    }

    const rateKey = 'panitia_pin_auth';
    const rateCheck = await checkRateLimit(rateKey);
    if (!rateCheck.allowed) {
      res.status(429).json({ status: 'error', message: rateCheck.message });
      return;
    }

    const pinHashEnv = process.env.PANITIA_PIN_HASH;

    // ⚠️ SECURITY FIX #3: Fail-fast if PANITIA_PIN_HASH is not configured
    if (!pinHashEnv) {
      res.status(500).json({ status: 'error', message: 'PANITIA_PIN_HASH belum dikonfigurasi di environment.' });
      return;
    }

    const isValid = await bcrypt.compare(pinStr, pinHashEnv);

    if (!isValid) {
      const failRec = await recordFailedAttempt(rateKey);
      if (failRec.locked) {
        res.status(429).json({
          status: 'error',
          message: 'Terlalu banyak percobaan gagal. Akses dikunci sementara. Silakan tunggu 15 menit.',
        });
        return;
      }
      res.status(401).json({ status: 'error', message: 'PIN Panitia salah.', valid: false });
      return;
    }

    await resetRateLimit(rateKey);

    const token = await signToken({
      role: 'panitia',
      name: 'Panitia Rihlah Paskibra Samarang',
    });

    res.setHeader(
      'Set-Cookie',
      `${PANITIA_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );

    res.json({
      status: 'success',
      valid: true,
      message: 'Login panitia berhasil!',
    });
  } catch (err) {
    console.error('Error saat login panitia:', err);
    res.status(500).json({ status: 'error', message: 'Gagal memproses login panitia.' });
  }
};

app.post('/api/auth/panitia/login', handleLoginPanitia);
app.post('/api/verifikasi-pin', handleLoginPanitia);

// 8. POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.setHeader('Set-Cookie', [
    `${PESERTA_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `${PANITIA_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ]);
  res.json({ status: 'success', message: 'Logout berhasil' });
});

// 9. POST /api/scan (Presensi QR Code, Prisma transaction, LogScan audit)
app.post('/api/scan', async (req: Request, res: Response) => {
  try {
    // ⚠️ SECURITY FIX #2: Guard clause — verifikasi sesi panitia sebelum memproses scan
    const token = getSession(req, 'panitia');
    const session = token ? await verifyToken(token) : null;
    if (!session || (session as any).role !== 'panitia') {
      res.status(401).json({ status: 'error', message: 'Akses ditolak. Fitur scanner hanya dapat digunakan oleh Panitia.' });
      return;
    }

    const { id, idPeserta, mode } = req.body || {};
    const targetId = (id || idPeserta || '').toString().trim().toUpperCase();
    const scanMode = mode === 'pulang' ? 'pulang' : 'berangkat';

    if (!targetId) {
      res.status(400).json({ status: 'error', message: 'ID Peserta tidak boleh kosong.' });
      return;
    }

    // Transaksi Prisma mencegah race condition scan bersamaan
    const result = await prisma.$transaction(async (tx) => {
      const peserta = await tx.peserta.findUnique({
        where: { idPeserta: targetId },
      });

      if (!peserta) {
        throw new Error('NOT_FOUND');
      }

      if (peserta.partisipasi !== 'Ikut') {
        throw new Error('STATUS_TIDAK_IKUT');
      }

      const now = new Date();
      const sesi = scanMode === 'berangkat' ? 'Keberangkatan' : 'Kepulangan';

      if (scanMode === 'berangkat') {
        if (peserta.waktuBerangkat) {
          throw new Error('ALREADY_SCANNED_BERANGKAT');
        }
        await tx.peserta.update({
          where: { id: peserta.id },
          data: { waktuBerangkat: now },
        });
      } else {
        if (peserta.waktuPulang) {
          throw new Error('ALREADY_SCANNED_PULANG');
        }
        await tx.peserta.update({
          where: { id: peserta.id },
          data: { waktuPulang: now },
        });
      }

      // Catat ke LogScan
      await tx.logScan.create({
        data: {
          idPeserta: peserta.idPeserta,
          nama: peserta.namaLengkap,
          keterangan: `Scan ${sesi}`,
          waktuScan: now,
        },
      });

      return { peserta, waktu: now };
    });

    res.json({
      status: 'success',
      nama: result.peserta.namaLengkap,
      idPeserta: result.peserta.idPeserta,
      mode: scanMode,
      message: `Presensi ${scanMode === 'berangkat' ? 'Keberangkatan' : 'Kepulangan'} ${result.peserta.namaLengkap} berhasil dicatat!`,
    });
  } catch (err: any) {
    if (err?.message === 'NOT_FOUND') {
      res.json({ status: 'error', message: 'ID Peserta tidak ditemukan dalam sistem.' });
      return;
    }
    if (err?.message === 'STATUS_TIDAK_IKUT') {
      res.json({ status: 'error', message: 'Peserta terdaftar dengan status TIDAK IKUT kegiatan.' });
      return;
    }
    if (err?.message === 'ALREADY_SCANNED_BERANGKAT') {
      res.json({ status: 'error', message: 'Peserta sudah tercatat presensi Keberangkatan sebelumnya.' });
      return;
    }
    if (err?.message === 'ALREADY_SCANNED_PULANG') {
      res.json({ status: 'error', message: 'Peserta sudah tercatat presensi Kepulangan sebelumnya.' });
      return;
    }

    console.error('Error saat proses scan presensi:', err);
    res.status(500).json({ status: 'error', message: 'Gagal memproses presensi scan.' });
  }
});

// 10. GET /api/peserta/profile
app.get('/api/peserta/profile', async (req: Request, res: Response) => {
  try {
    const token = getSession(req, 'peserta');
    const session = token ? await verifyToken(token) : null;
    if (!session || !(session as any).idPeserta) {
      res.status(401).json({ status: 'error', message: 'Sesi peserta tidak valid.' });
      return;
    }

    const p = await prisma.peserta.findUnique({
      where: { idPeserta: (session as any).idPeserta },
      select: {
        idPeserta: true,
        namaLengkap: true,
        jenisKelamin: true,
        asalSekolah: true,
        partisipasi: true,
        waktuBerangkat: true,
        waktuPulang: true,
        statusPassword: true,
      },
    });

    if (!p) {
      res.status(404).json({ status: 'error', message: 'Peserta tidak ditemukan.' });
      return;
    }

    res.json({
      status: 'success',
      data: {
        id: p.idPeserta,
        nama: p.namaLengkap,
        jk: p.jenisKelamin,
        unit: p.asalSekolah,
        partisipasi: p.partisipasi,
        waktuBerangkat: p.waktuBerangkat ? p.waktuBerangkat.toISOString() : '',
        waktuPulang: p.waktuPulang ? p.waktuPulang.toISOString() : '',
        statusPassword: p.statusPassword,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Gagal memuat profil peserta.' });
  }
});

// -------------------------------------------------------------
// VITE / SPA MIDDLEWARE SERVING
// -------------------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Giat Rihlah Paskibra Samarang (PostgreSQL + Prisma) aktif pada port ${PORT}`);
  });
}

start();
