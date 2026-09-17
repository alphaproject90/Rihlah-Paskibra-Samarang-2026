/**
 * passwordService.ts
 * Service layer untuk logika bisnis pergantian dan reset password (peserta & panitia).
 * Diekstrak dari api/auth/ganti-password.ts untuk memisahkan domain logic dari HTTP transport.
 * 
 * Mendukung:
 * - Ganti password aktif peserta (wajib password lama) & rotasi password panitia (Opsi 2)
 * - Alur forgot-password OTP berbasis wa.me panitia (Rencana Gabungan Opsi 3+4 Revisi)
 * - CATATAN KEAMANAN: Jalur forgot-password lama tanpa OTP telah DINONAKTIFKAN sepenuhnya.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../auth/rateLimit.js';
import { STRONG_PASSWORD_REGEX, GantiPasswordPesertaSchema } from '../validation/index.js';
import { logSystem } from '../logger.js';

// ============================================================================
// TYPE DEFINITIONS (KONTRAK RETURN VALUES)
// ============================================================================

/**
 * Kontrak response sukses untuk alur peserta (ganti password aktif).
 */
export interface PesertaPasswordSuccessBody {
  success: true;
  status: 'success';
  message: string;
}

/**
 * Kontrak response error untuk alur peserta.
 */
export interface PesertaPasswordErrorBody {
  error: string;
}

/**
 * Discriminated union untuk hasil operasi ganti password aktif peserta.
 */
export type ProcessPesertaPasswordResult =
  | {
      ok: true;
      status: 200;
      body: PesertaPasswordSuccessBody;
    }
  | {
      ok: false;
      status: 400 | 401 | 404 | 429 | 500;
      body: PesertaPasswordErrorBody;
    };

/**
 * Parameter input untuk alur ganti password aktif peserta.
 */
export interface ProcessPesertaPasswordInput {
  body: unknown;
  ip: string;
  sessionPeserta: unknown;
  sessionPanitia: unknown;
}

/**
 * Kontrak response sukses untuk rotasi password panitia aktif.
 */
export interface PanitiaPasswordSuccessBody {
  success: true;
  message: string;
}

/**
 * Kontrak response error otentikasi sesi panitia (status 401).
 */
export interface PanitiaPasswordAuthErrorBody {
  success: false;
  error: string;
}

/**
 * Kontrak response error umum untuk rotasi password panitia (status 400, 429, 500).
 */
export interface PanitiaPasswordGeneralErrorBody {
  error: string;
}

/**
 * Discriminated union untuk hasil operasi rotasi password panitia.
 */
export type ProcessPanitiaPasswordResult =
  | {
      ok: true;
      status: 200;
      body: PanitiaPasswordSuccessBody;
    }
  | {
      ok: false;
      status: 401;
      body: PanitiaPasswordAuthErrorBody;
    }
  | {
      ok: false;
      status: 400 | 429 | 500;
      body: PanitiaPasswordGeneralErrorBody;
    };

/**
 * Parameter input untuk rotasi password panitia.
 */
export interface ProcessPanitiaPasswordInput {
  body: unknown;
  session: unknown;
  ip: string;
}

// ============================================================================
// TYPE DEFINITIONS: RENCANA GABUNGAN OPSI 3+4 (WA.ME PANITIA-ASSISTED OTP)
// ============================================================================

/**
 * Parameter input untuk Langkah 1: Pengajuan Request OTP oleh peserta.
 */
export interface ProcessResetOtpRequestInput {
  body: unknown; // { identifier, noWa, unit? }
  ip: string;
}

/**
 * Discriminated union untuk hasil pengajuan request OTP.
 */
export type ProcessResetOtpRequestResult =
  | {
      ok: true;
      status: 200;
      body: {
        success: true;
        message: string;
        maskedPhone: string;
        requestId: string;
      };
    }
  | {
      ok: false;
      status: 400 | 429 | 500;
      body: {
        error: string;
      };
    };

/**
 * Parameter input untuk Langkah 6: Verifikasi OTP & Update Password.
 * Client WAJIB mengirim requestId opak dari Langkah 3 (bukan identifier/noWa).
 */
export interface ProcessResetOtpVerifyInput {
  body: unknown; // { requestId, otp, newPassword, confirmPassword? }
  ip: string;
}

/**
 * Discriminated union untuk hasil verifikasi OTP dan pergantian password.
 */
export type ProcessResetOtpVerifyResult =
  | {
      ok: true;
      status: 200;
      body: {
        success: true;
        message: string;
      };
    }
  | {
      ok: false;
      status: 400 | 429 | 500;
      body: {
        error: string;
      };
    };

/**
 * Struktur item antrean permohonan reset password peserta untuk dashboard panitia.
 */
export interface PanitiaPendingResetItem {
  id: string;
  idPeserta: string;
  nama: string;
  unit: string;
  noWaTersensor: string;
  status: 'PENDING' | 'SENT' | 'USED' | 'EXPIRED' | 'CANCELLED';
  attempts: number;
  createdAt: string;
  sentAt?: string | null;
  sentBy?: string | null;
  expiresAt: string;
}

/**
 * Parameter input untuk mengambil antrean permohonan reset password peserta oleh panitia.
 */
export interface ProcessPanitiaGetPendingResetsInput {
  session: unknown;
  ip: string;
}

/**
 * Discriminated union untuk hasil pengambilan antrean panitia.
 */
export type ProcessPanitiaGetPendingResetsResult =
  | {
      ok: true;
      status: 200;
      body: {
        success: true;
        data: PanitiaPendingResetItem[];
      };
    }
  | {
      ok: false;
      status: 401;
      body: {
        success: false;
        error: string;
      };
    }
  | {
      ok: false;
      status: 500;
      body: {
        error: string;
      };
    };

/**
 * Parameter input untuk membuat link pengiriman WhatsApp oleh panitia.
 */
export interface ProcessPanitiaGenerateWaLinkInput {
  body: unknown; // { requestId }
  session: unknown;
  ip: string;
}

/**
 * Discriminated union untuk hasil generate link WhatsApp.
 */
export type ProcessPanitiaGenerateWaLinkResult =
  | {
      ok: true;
      status: 200;
      body: {
        success: true;
        waLink: string;
        expiresAt: string;
      };
    }
  | {
      ok: false;
      status: 401;
      body: {
        success: false;
        error: string;
      };
    }
  | {
      ok: false;
      status: 400 | 404 | 429 | 500;
      body: {
        error: string;
      };
    };

/**
 * Parameter input untuk membatalkan antrean reset password oleh panitia.
 */
export interface ProcessPanitiaCancelResetInput {
  body: unknown; // { requestId, alasan? }
  session: unknown;
  ip: string;
}

/**
 * Discriminated union untuk hasil pembatalan permohonan reset oleh panitia.
 */
export type ProcessPanitiaCancelResetResult =
  | {
      ok: true;
      status: 200;
      body: {
        success: true;
        message: string;
      };
    }
  | {
      ok: false;
      status: 401;
      body: {
        success: false;
        error: string;
      };
    }
  | {
      ok: false;
      status: 400 | 404 | 500;
      body: {
        error: string;
      };
    };

// ============================================================================
// HELPER UTILITIES: TELEPON & KRIPTOGRAFI
// ============================================================================

/**
 * Normalisasi format nomor telepon Indonesia ke format standar berawalan '08'.
 * @param val String nomor telepon input
 * @returns String nomor telepon ternormalisasi
 */
export function normalizeIndonesianPhone(val: string): string {
  let d = val.replace(/\D/g, '');
  if (d.startsWith('62')) {
    d = '0' + d.slice(2);
  } else if (!d.startsWith('0') && d.length >= 9) {
    d = '0' + d;
  }
  return d;
}

/**
 * Derivasi subkey 32-byte dari master key menggunakan HKDF (RFC 5869)
 * untuk memisahkan domain enkripsi AES dan keyed-hash HMAC.
 * 
 * @param masterKey Kunci master rahasia dari environment (OTP_ENCRYPTION_KEY)
 * @param info Konteks tujuan subkey ('aes-encryption' atau 'hmac-hash')
 * @returns Buffer 32-byte kunci derivasi
 */
export function deriveKeyHKDF(masterKey: string, info: 'aes-encryption' | 'hmac-hash'): Buffer {
  return Buffer.from(crypto.hkdfSync('sha256', masterKey, '', info, 32));
}

/**
 * Enkripsi string OTP menggunakan algoritma AES-256-GCM dengan random IV 12-byte dan auth tag 16-byte.
 * @param otp String kode OTP plaintext (6 digit)
 * @param aesKey Buffer 32-byte hasil deriveKeyHKDF(masterKey, 'aes-encryption')
 * @returns String format "iv:authTag:ciphertext" (dalam hex)
 */
export function encryptOtpAesGcm(otp: string, aesKey: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(otp, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Dekripsi payload OTP terenkripsi menggunakan AES-256-GCM.
 * @param encryptedPayload String format "iv:authTag:ciphertext" (hex)
 * @param aesKey Buffer 32-byte hasil deriveKeyHKDF(masterKey, 'aes-encryption')
 * @returns String kode OTP plaintext
 */
export function decryptOtpAesGcm(encryptedPayload: string, aesKey: Buffer): string {
  const [ivHex, tagHex, cipherHex] = encryptedPayload.split(':');
  if (!ivHex || !tagHex || !cipherHex) {
    throw new Error('Format payload terenkripsi tidak valid');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * Menghitung keyed-hash HMAC-SHA256 dari string OTP menggunakan subkey HMAC.
 * @param otp String kode OTP (6 digit)
 * @param hmacKey Buffer 32-byte hasil deriveKeyHKDF(masterKey, 'hmac-hash')
 * @returns String hex digest HMAC-SHA256
 */
export function hashOtpHmac(otp: string, hmacKey: Buffer): string {
  return crypto.createHmac('sha256', hmacKey).update(otp).digest('hex');
}

/**
 * Sensor nomor telepon untuk tampilan publik yang aman (contoh: 0812****7890).
 */
export function maskPhoneNumber(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 8) return '****';
  return clean.slice(0, 4) + '****' + clean.slice(-4);
}

/**
 * Helper internal untuk memverifikasi kelayakan peserta untuk reset password.
 * Mengecek keberadaan akun, status partisipasi ('Ikut'), unit sekolah (jika diisi),
 * dan mencocokkan nomor WhatsApp terdaftar di DB (waPribadi / waDarurat).
 */
export async function verifyPesertaEligibilityForReset(
  identifier: string,
  noWaInput: string,
  unitInput?: string
): Promise<{
  eligible: boolean;
  peserta?: any;
  error?: string;
}> {
  const idTarget = (identifier || '').toString().trim();
  const waTarget = (noWaInput || '').toString().trim();

  if (!idTarget || !waTarget) {
    return {
      eligible: false,
      error: 'Username atau ID Peserta beserta Nomor WhatsApp wajib diisi.',
    };
  }

  const targetPeserta = await prisma.peserta.findFirst({
    where: {
      OR: [
        { username: idTarget },
        { idPeserta: { equals: idTarget, mode: 'insensitive' } },
      ],
    },
  });

  if (!targetPeserta) {
    return {
      eligible: false,
      error: 'Data tidak ditemukan atau nomor WhatsApp tidak cocok.',
    };
  }

  if (targetPeserta.partisipasi !== 'Ikut') {
    return {
      eligible: false,
      error: 'Data tidak ditemukan atau nomor WhatsApp tidak cocok.',
    };
  }

  if (unitInput && unitInput.trim()) {
    const inputUnit = unitInput.trim().toLowerCase();
    const dbUnit = (targetPeserta.asalSekolah || '').trim().toLowerCase();
    if (dbUnit !== inputUnit) {
      return {
        eligible: false,
        error: 'Data tidak ditemukan atau nomor WhatsApp tidak cocok.',
      };
    }
  }

  const waInputNorm = normalizeIndonesianPhone(waTarget);
  if (waInputNorm.length < 10 || waInputNorm.length > 15) {
    return {
      eligible: false,
      error: 'Format nomor WhatsApp tidak valid. Masukkan nomor lengkap minimal 10 digit.',
    };
  }

  const dbWaPribadiNorm = normalizeIndonesianPhone(targetPeserta.waPribadi || '');
  const dbWaDaruratNorm = normalizeIndonesianPhone(targetPeserta.waDarurat || '');

  const isWaMatch =
    (dbWaPribadiNorm && dbWaPribadiNorm === waInputNorm) ||
    (dbWaDaruratNorm && dbWaDaruratNorm === waInputNorm);

  if (!isWaMatch) {
    return {
      eligible: false,
      error: 'Data tidak ditemukan atau nomor WhatsApp tidak cocok.',
    };
  }

  return { eligible: true, peserta: targetPeserta };
}

// ============================================================================
// SERVICE FUNCTIONS: GANTI PASSWORD AKTIF (HANYA DENGAN PASSWORD LAMA)
// ============================================================================

/**
 * Memproses alur ganti password aktif peserta (WAJIB menyertakan password lama).
 * 
 * CATATAN KEAMANAN (Revisi #1):
 * Jalur forgot-password lama tanpa OTP (isForgotReset) telah DINONAKTIFKAN sepenuhnya.
 * Jika request tidak menyertakan oldPassword, fungsi langsung me-return HTTP 400
 * yang mengarahkan user ke fitur OTP WhatsApp.
 * 
 * @param input ProcessPesertaPasswordInput
 * @returns Promise<ProcessPesertaPasswordResult>
 */
export async function processPesertaGantiPassword(
  input: ProcessPesertaPasswordInput
): Promise<ProcessPesertaPasswordResult> {
  const { body, ip, sessionPeserta, sessionPanitia } = input;

  try {
    const parseResult = GantiPasswordPesertaSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors[0]?.message || 'Data ganti password tidak valid';
      return {
        ok: false,
        status: 400,
        body: { error: errorMsg },
      };
    }

    const { identifier, username, oldPassword, newPassword } = (body as Record<string, any>) || {};
    const idTarget = (identifier || username || '').toString().trim();
    const newPassStr = (newPassword || '').toString();

    // 1. Guard Kritis: Tolak request tanpa oldPassword (menutup total bypass forgot-reset lama)
    if (!oldPassword) {
      return {
        ok: false,
        status: 400,
        body: {
          error: "Gunakan fitur 'Lupa Password' untuk reset via kode OTP WhatsApp.",
        },
      };
    }

    // 2. Validasi kekuatan password baru
    if (!STRONG_PASSWORD_REGEX.test(newPassStr)) {
      return {
        ok: false,
        status: 400,
        body: {
          error: 'Password minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.',
        },
      };
    }

    const isPanitiaReset = Boolean(sessionPanitia && (sessionPanitia as { role?: string }).role === 'panitia');

    // 3. Rate limiting alur aktif
    const ipKey = `ganti_pass_active_ip_${ip}`;
    const idUser = (sessionPeserta as { idPeserta?: string })?.idPeserta || idTarget;
    const targetKey = `ganti_pass_active_user_${idUser}`;

    if (!isPanitiaReset) {
      const [ipCheck, targetCheck] = await Promise.all([
        checkRateLimit(ipKey),
        checkRateLimit(targetKey),
      ]);

      if (!ipCheck.allowed || !targetCheck.allowed) {
        return {
          ok: false,
          status: 429,
          body: { error: ipCheck.message || targetCheck.message || 'Terlalu banyak percobaan gagal. Akses dikunci sementara. Silakan tunggu 15 menit.' },
        };
      }
    }

    // 4. Temukan peserta target
    let targetPeserta = null;
    if (sessionPeserta && (sessionPeserta as { idPeserta?: string }).idPeserta && !isPanitiaReset) {
      const idPeserta = (sessionPeserta as { idPeserta?: string }).idPeserta;
      targetPeserta = await prisma.peserta.findUnique({ where: { idPeserta } });
    } else if (idTarget) {
      targetPeserta = await prisma.peserta.findFirst({
        where: {
          OR: [
            { username: idTarget },
            { idPeserta: { equals: idTarget, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!targetPeserta) {
      return {
        ok: false,
        status: 404,
        body: { error: 'Akun peserta tidak ditemukan.' },
      };
    }

    // 5. Verifikasi password lama jika akun sudah memiliki passwordHash
    if (!isPanitiaReset && targetPeserta.passwordHash) {
      const isValid = await bcrypt.compare(oldPassword, targetPeserta.passwordHash);
      if (!isValid) {
        const [ipFail, targetFail] = await Promise.all([
          recordFailedAttempt(ipKey),
          recordFailedAttempt(targetKey),
        ]);
        if (ipFail.locked || targetFail.locked) {
          logSystem({
            level: 'WARN',
            action: 'GANTI_PASSWORD_LOCKED',
            details: { target: idTarget },
            ipAddress: ip,
          });
          return {
            ok: false,
            status: 429,
            body: { error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' },
          };
        }
        return {
          ok: false,
          status: 401,
          body: { error: 'Password lama salah.' },
        };
      }
    }

    // 6. Hash password baru & simpan
    const newPasswordHash = await bcrypt.hash(newPassStr, 12);
    await prisma.peserta.update({
      where: { id: targetPeserta.id },
      data: {
        passwordHash: newPasswordHash,
        statusPassword: 'Selesai',
      },
    });

    if (!isPanitiaReset) {
      await Promise.all([resetRateLimit(ipKey), resetRateLimit(targetKey)]);
    }

    logSystem({
      level: 'INFO',
      action: 'GANTI_PASSWORD_ACTIVE_SUCCESS',
      actorId: targetPeserta.idPeserta || targetPeserta.username || idTarget,
      details: {
        flow: 'active_change',
        idPeserta: targetPeserta.idPeserta,
      },
      ipAddress: ip,
    });

    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        status: 'success',
        message: 'Password berhasil diubah.',
      },
    };
  } catch (error) {
    console.error('Ganti password aktif error:', error);
    return {
      ok: false,
      status: 500,
      body: { error: 'Internal Server Error' },
    };
  }
}

// ============================================================================
// SERVICE FUNCTIONS: ROTASI PASSWORD PANITIA (OPSI 2)
// ============================================================================

export async function processPanitiaGantiPassword(
  input: ProcessPanitiaPasswordInput
): Promise<ProcessPanitiaPasswordResult> {
  const { body, session, ip } = input;
  const rateLimitKey = `panitia_ganti_pass_ip_${ip}`;

  try {
    if (!session || (session as any).role !== 'panitia') {
      return {
        ok: false,
        status: 401,
        body: {
          success: false,
          error: 'Sesi panitia tidak valid atau telah kedaluwarsa. Silakan login ulang.',
        },
      };
    }

    const rateLimitCheck = await checkRateLimit(rateLimitKey);
    if (!rateLimitCheck.allowed) {
      return {
        ok: false,
        status: 429,
        body: { error: rateLimitCheck.message || 'Terlalu banyak percobaan gagal.' },
      };
    }

    const { oldPassword, newPassword, confirmPassword } = (body as Record<string, any>) || {};

    if (!oldPassword || typeof oldPassword !== 'string') {
      return {
        ok: false,
        status: 400,
        body: { error: 'Password lama wajib diisi.' },
      };
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return {
        ok: false,
        status: 400,
        body: { error: 'Password baru wajib diisi.' },
      };
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return {
        ok: false,
        status: 400,
        body: { error: 'Konfirmasi password baru tidak cocok.' },
      };
    }

    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      return {
        ok: false,
        status: 400,
        body: {
          error: 'Password baru minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.',
        },
      };
    }

    const pengaturan = await prisma.pengaturan.findUnique({ where: { id: 'singleton' } });
    const currentHash = (pengaturan as any)?.panitiaPasswordHash || process.env.PANITIA_PASSWORD_HASH;

    if (!currentHash) {
      return {
        ok: false,
        status: 500,
        body: { error: 'Server misconfiguration: Kredensial panitia tidak terdaftar.' },
      };
    }

    const isOldMatch = await bcrypt.compare(oldPassword, currentHash);
    if (!isOldMatch) {
      const { locked } = await recordFailedAttempt(rateLimitKey);
      if (locked) {
        logSystem({
          level: 'CRITICAL',
          action: 'PANITIA_PASSWORD_CHANGE_LOCKED',
          actorId: 'panitia',
          ipAddress: ip,
        });
        return {
          ok: false,
          status: 429,
          body: { error: 'Terlalu banyak percobaan gagal. Akses dikunci 15 menit.' },
        };
      }

      logSystem({
        level: 'WARN',
        action: 'PANITIA_PASSWORD_CHANGE_FAILED',
        actorId: 'panitia',
        details: { reason: 'invalid_old_password' },
        ipAddress: ip,
      });

      return {
        ok: false,
        status: 400,
        body: { error: 'Password lama tidak sesuai.' },
      };
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await (prisma.pengaturan as any).upsert({
      where: { id: 'singleton' },
      update: {
        panitiaPasswordHash: newHash,
        updatedOleh: (session as any).username || 'panitia',
      },
      create: {
        id: 'singleton',
        panitiaPasswordHash: newHash,
        updatedOleh: (session as any).username || 'panitia',
      },
    });

    await resetRateLimit(rateLimitKey);

    logSystem({
      level: 'INFO',
      action: 'PANITIA_PASSWORD_CHANGED',
      actorId: 'panitia',
      details: { message: 'Password panitia berhasil diperbarui via dasbor pengaturan' },
      ipAddress: ip,
    });

    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: 'Password panitia berhasil diperbarui! Gunakan password baru untuk login berikutnya.',
      },
    };
  } catch (error) {
    console.error('Error saat ganti password panitia:', error);
    return {
      ok: false,
      status: 500,
      body: { error: 'Terjadi kesalahan sistem saat memperbarui password panitia.' },
    };
  }
}

// ============================================================================
// SERVICE FUNCTIONS (IMPLEMENTASI PENUH): RENCANA GABUNGAN OPSI 3+4 REVISI
// ============================================================================

/**
 * Langkah 1-3: Pengajuan Permintaan Reset Password & Generate OTP
 */
export async function requestPesertaResetOtp(
  input: ProcessResetOtpRequestInput
): Promise<ProcessResetOtpRequestResult> {
  const { body, ip } = input;
  const ipKey = `ganti_pass_otp_req_ip_${ip}`;

  try {
    // 1. Fail-fast check: Pastikan OTP_ENCRYPTION_KEY telah dikonfigurasi di environment server
    const masterKey = process.env.OTP_ENCRYPTION_KEY;
    if (!masterKey || masterKey.trim().length < 32) {
      console.error('CRITICAL: OTP_ENCRYPTION_KEY is not configured or too short');
      return {
        ok: false,
        status: 500,
        body: { error: 'Server misconfiguration: Kunci enkripsi OTP belum dikonfigurasi.' },
      };
    }

    // 2. Periksa rate limit IP
    const ipCheck = await checkRateLimit(ipKey);
    if (!ipCheck.allowed) {
      return {
        ok: false,
        status: 429,
        body: { error: ipCheck.message || 'Terlalu banyak permohonan OTP dari IP ini. Silakan coba 15 menit lagi.' },
      };
    }

    const { identifier, username, noWa, unit, asalSekolah } = (body as Record<string, any>) || {};
    const idInput = (identifier || username || '').toString().trim();
    const waInput = (noWa || '').toString().trim();
    const unitInput = (unit || asalSekolah || '').toString().trim();

    // 3. Verifikasi kelayakan peserta (reuse helper teruji)
    const eligibility = await verifyPesertaEligibilityForReset(idInput, waInput, unitInput);
    if (!eligibility.eligible || !eligibility.peserta) {
      // Delay anti-enumeration
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));
      await recordFailedAttempt(ipKey);
      return {
        ok: false,
        status: 400,
        body: { error: eligibility.error || 'Data tidak ditemukan atau nomor WhatsApp tidak cocok.' },
      };
    }

    const targetPeserta = eligibility.peserta;
    const targetKey = `ganti_pass_otp_target_${targetPeserta.idPeserta}`;

    // 4. Periksa rate limit target user
    const targetCheck = await checkRateLimit(targetKey);
    if (!targetCheck.allowed) {
      return {
        ok: false,
        status: 429,
        body: { error: targetCheck.message || 'Permohonan OTP untuk akun ini terlalu sering. Harap tunggu beberapa saat.' },
      };
    }

    // 5. Generate 6-digit cryptographic OTP acak
    const otpNumber = crypto.randomInt(100000, 1000000);
    const otp = otpNumber.toString();

    // 6. Derive subkeys dari master key via HKDF
    const aesKey = deriveKeyHKDF(masterKey, 'aes-encryption');
    const hmacKey = deriveKeyHKDF(masterKey, 'hmac-hash');

    // 7. Enkripsi untuk panitia (AES-256-GCM) & keyed-hash untuk verifikasi (HMAC-SHA256)
    const otpEncrypted = encryptOtpAesGcm(otp, aesKey);
    const otpHash = hashOtpHmac(otp, hmacKey);

    // 8. Ambil nomor tujuan resmi dari DB
    const targetPhone = targetPeserta.waPribadi || targetPeserta.waDarurat || waInput;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit batas awal antrean

    // 9. Batalkan antrean pending lama untuk peserta ini agar tidak duplikat
    await prisma.resetPasswordRequest.updateMany({
      where: {
        idPeserta: targetPeserta.idPeserta,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    // 10. Simpan permohonan ke database
    const newReq = await prisma.resetPasswordRequest.create({
      data: {
        idPeserta: targetPeserta.idPeserta,
        nama: targetPeserta.namaLengkap,
        noWaTujuan: targetPhone,
        otpHash,
        otpEncrypted,
        status: 'PENDING',
        expiresAt,
      },
    });

    // 11. Catat log audit trail
    logSystem({
      level: 'INFO',
      action: 'RESET_PASSWORD_OTP_REQUESTED',
      actorId: targetPeserta.idPeserta,
      details: {
        requestId: newReq.id,
        idPeserta: targetPeserta.idPeserta,
      },
      ipAddress: ip,
    });

    // 12. Kembalikan response (NOL PLAINTEXT OTP DI RESPONSE!)
    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: 'Permohonan kode OTP berhasil diajukan. Hubungi panitia untuk mendapatkan kode OTP Anda.',
        maskedPhone: maskPhoneNumber(targetPhone),
        requestId: newReq.id,
      },
    };
  } catch (error) {
    console.error('Error requestPesertaResetOtp:', error);
    return {
      ok: false,
      status: 500,
      body: { error: 'Terjadi kesalahan sistem saat memproses permohonan OTP.' },
    };
  }
}

/**
 * Langkah 6: Verifikasi OTP dan Pergantian Password Baru Peserta
 */
export async function verifyPesertaResetOtp(
  input: ProcessResetOtpVerifyInput
): Promise<ProcessResetOtpVerifyResult> {
  const { body, ip } = input;
  const ipKey = `ganti_pass_otp_verify_ip_${ip}`;

  try {
    const masterKey = process.env.OTP_ENCRYPTION_KEY;
    if (!masterKey || masterKey.trim().length < 32) {
      console.error('CRITICAL: OTP_ENCRYPTION_KEY is not configured or too short');
      return {
        ok: false,
        status: 500,
        body: { error: 'Server misconfiguration: Kunci enkripsi OTP belum dikonfigurasi.' },
      };
    }

    const ipCheck = await checkRateLimit(ipKey);
    if (!ipCheck.allowed) {
      return {
        ok: false,
        status: 429,
        body: { error: ipCheck.message || 'Terlalu banyak percobaan verifikasi. Akses dikunci sementara.' },
      };
    }

    const { requestId, otp, newPassword, confirmPassword } = (body as Record<string, any>) || {};

    if (!requestId || typeof requestId !== 'string' || !requestId.trim()) {
      return {
        ok: false,
        status: 400,
        body: { error: 'Request ID tidak valid atau tidak ditemukan.' },
      };
    }

    const otpStr = (otp || '').toString().trim();
    if (!/^\d{6}$/.test(otpStr)) {
      return {
        ok: false,
        status: 400,
        body: { error: 'Kode OTP harus berupa 6 digit angka.' },
      };
    }

    const newPassStr = (newPassword || '').toString();
    if (!newPassStr) {
      return {
        ok: false,
        status: 400,
        body: { error: 'Password baru wajib diisi.' },
      };
    }

    if (confirmPassword && newPassStr !== confirmPassword.toString()) {
      return {
        ok: false,
        status: 400,
        body: { error: 'Konfirmasi password baru tidak cocok.' },
      };
    }

    if (!STRONG_PASSWORD_REGEX.test(newPassStr)) {
      return {
        ok: false,
        status: 400,
        body: {
          error: 'Password minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.',
        },
      };
    }

    // Ambil record reset request
    const resetReq = await prisma.resetPasswordRequest.findUnique({
      where: { id: requestId.trim() },
    });

    if (!resetReq || (resetReq.status !== 'PENDING' && resetReq.status !== 'SENT')) {
      return {
        ok: false,
        status: 400,
        body: { error: 'Permohonan reset password tidak valid, telah digunakan, atau sudah kedaluwarsa.' },
      };
    }

    // Periksa masa berlaku
    if (new Date() > resetReq.expiresAt) {
      await prisma.resetPasswordRequest.update({
        where: { id: resetReq.id },
        data: { status: 'EXPIRED' },
      });
      return {
        ok: false,
        status: 400,
        body: { error: 'Kode OTP telah kedaluwarsa. Silakan ajukan permohonan baru.' },
      };
    }

    // Periksa counter percobaan salah (maksimal 3 kali)
    if (resetReq.attempts >= 3) {
      await prisma.resetPasswordRequest.update({
        where: { id: resetReq.id },
        data: { status: 'EXPIRED' },
      });
      return {
        ok: false,
        status: 429,
        body: { error: 'Terlalu banyak percobaan salah. Permohonan OTP dihanguskan. Silakan ajukan ulang.' },
      };
    }

    // Verifikasi HMAC-SHA256 dengan constant-time comparison
    const hmacKey = deriveKeyHKDF(masterKey, 'hmac-hash');
    const computedHmac = hashOtpHmac(otpStr, hmacKey);

    const bufComputed = Buffer.from(computedHmac, 'hex');
    const bufStored = Buffer.from(resetReq.otpHash, 'hex');

    const isMatch =
      bufComputed.length === bufStored.length &&
      crypto.timingSafeEqual(bufComputed, bufStored);

    if (!isMatch) {
      const nextAttempts = resetReq.attempts + 1;
      const willExpire = nextAttempts >= 3;

      await prisma.resetPasswordRequest.update({
        where: { id: resetReq.id },
        data: {
          attempts: nextAttempts,
          status: willExpire ? 'EXPIRED' : resetReq.status,
        },
      });

      await recordFailedAttempt(ipKey);

      if (willExpire) {
        return {
          ok: false,
          status: 429,
          body: { error: 'Kode OTP salah 3 kali berturut-turut. Permohonan dihanguskan. Silakan ajukan ulang.' },
        };
      }

      return {
        ok: false,
        status: 400,
        body: { error: `Kode OTP salah. Sisa kesempatan: ${3 - nextAttempts} kali.` },
      };
    }

    // Hash password baru dengan bcrypt cost factor 12
    const newPasswordHash = await bcrypt.hash(newPassStr, 12);

    // Update peserta di DB
    await prisma.peserta.update({
      where: { idPeserta: resetReq.idPeserta },
      data: {
        passwordHash: newPasswordHash,
        statusPassword: 'Selesai',
      },
    });

    // Tandai request sebagai USED
    await prisma.resetPasswordRequest.update({
      where: { id: resetReq.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
      },
    });

    // Reset rate limit IP
    await resetRateLimit(ipKey);

    // Catat log audit trail
    logSystem({
      level: 'INFO',
      action: 'RESET_PASSWORD_OTP_SUCCESS',
      actorId: resetReq.idPeserta,
      details: {
        requestId: resetReq.id,
        idPeserta: resetReq.idPeserta,
      },
      ipAddress: ip,
    });

    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: 'Password berhasil diperbarui! Silakan login kembali dengan password baru Anda.',
      },
    };
  } catch (error) {
    console.error('Error verifyPesertaResetOtp:', error);
    return {
      ok: false,
      status: 500,
      body: { error: 'Terjadi kesalahan sistem saat memverifikasi OTP.' },
    };
  }
}

/**
 * Langkah 4a: Mengambil Daftar Antrean Permohonan Reset untuk Dashboard Panitia
 */
export async function getPanitiaPendingResets(
  input: ProcessPanitiaGetPendingResetsInput
): Promise<ProcessPanitiaGetPendingResetsResult> {
  const { session } = input;

  try {
    if (!session || (session as any).role !== 'panitia') {
      return {
        ok: false,
        status: 401,
        body: {
          success: false,
          error: 'Sesi panitia tidak valid atau telah kedaluwarsa. Silakan login ulang.',
        },
      };
    }

    const pendingRequests = await prisma.resetPasswordRequest.findMany({
      where: {
        status: { in: ['PENDING', 'SENT'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        peserta: {
          select: {
            asalSekolah: true,
          },
        },
      },
    });

    const data: PanitiaPendingResetItem[] = pendingRequests.map((r) => ({
      id: r.id,
      idPeserta: r.idPeserta,
      nama: r.nama,
      unit: r.peserta?.asalSekolah || '-',
      noWaTersensor: maskPhoneNumber(r.noWaTujuan),
      status: r.status as PanitiaPendingResetItem['status'],
      attempts: r.attempts,
      createdAt: r.createdAt.toISOString(),
      sentAt: r.sentAt ? r.sentAt.toISOString() : null,
      sentBy: r.sentBy || null,
      expiresAt: r.expiresAt.toISOString(),
    }));

    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        data,
      },
    };
  } catch (error) {
    console.error('Error getPanitiaPendingResets:', error);
    return {
      ok: false,
      status: 500,
      body: { error: 'Terjadi kesalahan sistem saat mengambil antrean reset password.' },
    };
  }
}

/**
 * Langkah 4b: Membuat Link WhatsApp wa.me untuk Pengiriman Manual oleh Panitia
 */
export async function generatePanitiaWaLink(
  input: ProcessPanitiaGenerateWaLinkInput
): Promise<ProcessPanitiaGenerateWaLinkResult> {
  const { body, session, ip } = input;

  try {
    if (!session || (session as any).role !== 'panitia') {
      return {
        ok: false,
        status: 401,
        body: {
          success: false,
          error: 'Sesi panitia tidak valid atau telah kedaluwarsa. Silakan login ulang.',
        },
      };
    }

    const masterKey = process.env.OTP_ENCRYPTION_KEY;
    if (!masterKey || masterKey.trim().length < 32) {
      console.error('CRITICAL: OTP_ENCRYPTION_KEY is not configured or too short');
      return {
        ok: false,
        status: 500,
        body: { error: 'Server misconfiguration: Kunci enkripsi OTP belum dikonfigurasi.' },
      };
    }

    const { requestId } = (body as Record<string, any>) || {};
    if (!requestId || typeof requestId !== 'string' || !requestId.trim()) {
      return {
        ok: false,
        status: 400,
        body: { error: 'Request ID tidak valid.' },
      };
    }

    const resetReq = await prisma.resetPasswordRequest.findUnique({
      where: { id: requestId.trim() },
    });

    if (!resetReq || (resetReq.status !== 'PENDING' && resetReq.status !== 'SENT')) {
      return {
        ok: false,
        status: 404,
        body: { error: 'Permohonan reset password tidak ditemukan atau sudah tidak aktif.' },
      };
    }

    // Dekripsi OTP plaintext via HKDF subkey AES
    const aesKey = deriveKeyHKDF(masterKey, 'aes-encryption');
    let otpPlaintext = '';
    try {
      otpPlaintext = decryptOtpAesGcm(resetReq.otpEncrypted, aesKey);
    } catch (decErr) {
      console.error('Gagal mendekripsi OTP:', decErr);
      return {
        ok: false,
        status: 500,
        body: { error: 'Gagal mendekripsi kode OTP. Mohon hubungi administrator.' },
      };
    }

    // Normalisasi nomor tujuan ke format internasional berawalan 62
    let intlPhone = resetReq.noWaTujuan.replace(/\D/g, '');
    if (intlPhone.startsWith('0')) {
      intlPhone = '62' + intlPhone.slice(1);
    } else if (!intlPhone.startsWith('62')) {
      intlPhone = '62' + intlPhone;
    }

    // Format pesan WhatsApp yang ramah dan jelas
    const messageLines = [
      `Halo *${resetReq.nama}* (${resetReq.idPeserta}),`,
      `Berikut adalah kode OTP untuk verifikasi reset password akun Rihlah Paskibra Anda:`,
      ``,
      `🔐 Kode OTP: *${otpPlaintext}*`,
      `⏰ Berlaku: 10 menit`,
      ``,
      `Jangan bagikan kode ini kepada siapa pun. Abaikan pesan ini jika Anda tidak merasa meminta reset password.`,
      `- Panitia Giat Rihlah Paskibra Samarang 2026`,
    ];
    const messageText = messageLines.join('\n');
    const waLink = `https://wa.me/${intlPhone}?text=${encodeURIComponent(messageText)}`;

    // Refresh masa berlaku: 10 menit sejak panitia membuat/mengirimkan link
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const sentByUsername = (session as any).username || 'panitia';

    await prisma.resetPasswordRequest.update({
      where: { id: resetReq.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentBy: sentByUsername,
        expiresAt: newExpiresAt,
      },
    });

    logSystem({
      level: 'INFO',
      action: 'PANITIA_OTP_LINK_GENERATED',
      actorId: sentByUsername,
      details: {
        requestId: resetReq.id,
        idPeserta: resetReq.idPeserta,
      },
      ipAddress: ip,
    });

    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        waLink,
        expiresAt: newExpiresAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error generatePanitiaWaLink:', error);
    return {
      ok: false,
      status: 500,
      body: { error: 'Terjadi kesalahan sistem saat membuat tautan WhatsApp.' },
    };
  }
}

/**
 * Revisi #2: Membatalkan Permohonan Reset Password dalam Antrean Panitia
 */
export async function cancelPanitiaResetRequest(
  input: ProcessPanitiaCancelResetInput
): Promise<ProcessPanitiaCancelResetResult> {
  const { body, session, ip } = input;

  try {
    if (!session || (session as any).role !== 'panitia') {
      return {
        ok: false,
        status: 401,
        body: {
          success: false,
          error: 'Sesi panitia tidak valid atau telah kedaluwarsa. Silakan login ulang.',
        },
      };
    }

    const { requestId } = (body as Record<string, any>) || {};
    if (!requestId || typeof requestId !== 'string' || !requestId.trim()) {
      return {
        ok: false,
        status: 400,
        body: { error: 'Request ID tidak valid.' },
      };
    }

    const resetReq = await prisma.resetPasswordRequest.findUnique({
      where: { id: requestId.trim() },
    });

    if (!resetReq) {
      return {
        ok: false,
        status: 404,
        body: { error: 'Permohonan reset password tidak ditemukan.' },
      };
    }

    const canceller = (session as any).username || 'panitia';

    await prisma.resetPasswordRequest.update({
      where: { id: resetReq.id },
      data: {
        status: 'CANCELLED',
      },
    });

    logSystem({
      level: 'INFO',
      action: 'PANITIA_RESET_REQUEST_CANCELLED',
      actorId: canceller,
      details: {
        requestId: resetReq.id,
        idPeserta: resetReq.idPeserta,
        canceledBy: canceller,
      },
      ipAddress: ip,
    });

    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: 'Permohonan reset password berhasil dibatalkan.',
      },
    };
  } catch (error) {
    console.error('Error cancelPanitiaResetRequest:', error);
    return {
      ok: false,
      status: 500,
      body: { error: 'Terjadi kesalahan sistem saat membatalkan permohonan reset password.' },
    };
  }
}
