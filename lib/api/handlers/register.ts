import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../prisma.js';
import bcrypt from 'bcryptjs';
import { checkRateLimit, recordFailedAttempt } from '../../auth/rateLimit.js';
import { RegisterPesertaSchema } from '../../validation/index.js';

// Konstanta konfigurasi rate limit pendaftaran (kolektif sekolah via satu jaringan/IP)
const REGISTER_RATE_LIMIT_MAX = 30;
const REGISTER_LOCK_DURATION_SECONDS = 900; // 15 menit

export default async function handleRegister(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, status: 'error', error: 'Method not allowed', message: 'Method not allowed' });
  }

  // Rate limiting anti-spam per-IP
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `register_ip_${ip}`;

  const rateLimitCheck = await checkRateLimit(rateLimitKey);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      success: false,
      status: 'error',
      error: 'Terlalu banyak permintaan pendaftaran dari jaringan Anda. Silakan coba lagi setelah 15 menit.',
      message: 'Terlalu banyak permintaan pendaftaran dari jaringan Anda. Silakan coba lagi setelah 15 menit.',
    });
  }

  // Catat percobaan pendaftaran untuk IP ini
  const attemptRecord = await recordFailedAttempt(rateLimitKey, REGISTER_RATE_LIMIT_MAX, REGISTER_LOCK_DURATION_SECONDS);
  if (attemptRecord.locked) {
    return res.status(429).json({
      success: false,
      status: 'error',
      error: 'Terlalu banyak permintaan pendaftaran dari jaringan Anda. Silakan coba lagi setelah 15 menit.',
      message: 'Terlalu banyak permintaan pendaftaran dari jaringan Anda. Silakan coba lagi setelah 15 menit.',
    });
  }

  try {
    const parseResult = RegisterPesertaSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Data pendaftaran tidak valid.';
      return res.status(400).json({ success: false, status: 'error', error: firstError, message: firstError });
    }

    const payload = parseResult.data;
    const isIkut = payload.partisipasi === 'Ikut';

    // Auto-retry loop untuk menangani race condition pada idPeserta (maksimal 3 percobaan)
    const MAX_RETRIES = 3;
    let attempt = 0;
    let created = null;

    while (attempt < MAX_RETRIES) {
      attempt++;
      try {
        created = await prisma.$transaction(async (tx) => {
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
            let nextNum = countIkut + 1;
            idPeserta = `PASK-${String(nextNum).padStart(4, '0')}`;
            let exists = await tx.peserta.findUnique({ where: { idPeserta } });
            while (exists) {
              nextNum++;
              idPeserta = `PASK-${String(nextNum).padStart(4, '0')}`;
              exists = await tx.peserta.findUnique({ where: { idPeserta } });
            }
          } else {
            const countTidak = await tx.peserta.count({ where: { partisipasi: 'Tidak Ikut' } });
            let nextNumTidak = countTidak + 1;
            idPeserta = `TIDAK-IKUT-${String(nextNumTidak).padStart(4, '0')}`;
            let exists = await tx.peserta.findUnique({ where: { idPeserta } });
            while (exists) {
              nextNumTidak++;
              idPeserta = `TIDAK-IKUT-${String(nextNumTidak).padStart(4, '0')}`;
              exists = await tx.peserta.findUnique({ where: { idPeserta } });
            }
          }

          // Hash password dengan bcrypt cost factor 12
          let passHash: string | null = null;
          if (isIkut && payload.password) {
            passHash = await bcrypt.hash(payload.password, 12);
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

        // Transaksi berhasil, keluar dari retry loop
        break;
      } catch (txErr: any) {
        if (txErr?.message === 'DUPLICATE_USERNAME') {
          return res.status(409).json({
            success: false,
            status: 'error',
            error: 'Username sudah digunakan. Silakan pilih username lain.',
            message: 'Username sudah digunakan. Silakan pilih username lain.',
          });
        }

        const targetStr = JSON.stringify(txErr?.meta?.target || '');
        if (txErr?.code === 'P2002') {
          if (targetStr.includes('username')) {
            return res.status(409).json({
              success: false,
              status: 'error',
              error: 'Username sudah digunakan. Silakan pilih username lain.',
              message: 'Username sudah digunakan. Silakan pilih username lain.',
            });
          }

          // Jika tabrakan terjadi pada idPeserta dan masih ada sisa retry, coba lagi
          if ((targetStr.includes('idPeserta') || !targetStr.includes('username')) && attempt < MAX_RETRIES) {
            console.warn(`[REGISTER] Tabrakan idPeserta terdeteksi (attempt ${attempt}/${MAX_RETRIES}), mencoba alokasi sekuensial ulang...`);
            continue;
          }
        }

        throw txErr;
      }
    }

    if (!created) {
      return res.status(409).json({
        success: false,
        status: 'error',
        error: 'Antrean pendaftaran sedang padat. Silakan kirim ulang formulir Anda.',
        message: 'Antrean pendaftaran sedang padat. Silakan kirim ulang formulir Anda.',
      });
    }

    return res.status(201).json({
      success: true,
      status: 'success',
      id: created.idPeserta,
      data: {
        idPeserta: created.idPeserta,
      },
      message: 'Pendaftaran berhasil disimpan!',
    });
  } catch (err: any) {
    console.error('Error pendaftaran peserta:', err);
    return res.status(500).json({
      success: false,
      status: 'error',
      error: 'Terjadi kesalahan sistem saat mendaftar.',
      message: 'Terjadi kesalahan sistem saat mendaftar.',
    });
  }
}
