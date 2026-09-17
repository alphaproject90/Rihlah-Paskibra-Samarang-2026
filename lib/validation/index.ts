import { z } from 'zod';

export const PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,20}$/;
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const RegisterPesertaSchema = z
  .object({
    nama: z.string().min(2, { message: 'Nama lengkap minimal 2 karakter.' }),
    jk: z.enum(['Laki-laki', 'Perempuan'], {
      errorMap: () => ({ message: 'Pilih jenis kelamin yang valid.' }),
    }),
    unit: z.string().min(2, { message: 'Asal sekolah / unit wajib diisi.' }),
    partisipasi: z.enum(['Ikut', 'Tidak Ikut'], {
      errorMap: () => ({ message: 'Pilihan partisipasi tidak valid.' }),
    }),
    alasan: z.string().optional(),
    waPeserta: z.string().optional(),
    waDarurat: z.string().optional(),
    medis: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.partisipasi === 'Ikut') {
      if (!data.waPeserta || !PHONE_REGEX.test(data.waPeserta.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['waPeserta'],
          message: 'Nomor WhatsApp pribadi tidak valid (contoh: 08123456789).',
        });
      }
      if (!data.waDarurat || !PHONE_REGEX.test(data.waDarurat.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['waDarurat'],
          message: 'Nomor WhatsApp kontak darurat tidak valid.',
        });
      }
      if (!data.username || !USERNAME_REGEX.test(data.username.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['username'],
          message: 'Username harus 4-20 karakter alfanumerik atau underscore.',
        });
      }
      if (!data.password || !STRONG_PASSWORD_REGEX.test(data.password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Password minimal 8 karakter kombinasi huruf besar, kecil, angka, dan simbol.',
        });
      }
    } else {
      if (!data.alasan || data.alasan.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['alasan'],
          message: 'Harap cantumkan alasan tidak mengikuti kegiatan rihlah.',
        });
      }
    }
  });

export const LoginPesertaSchema = z.object({
  username: z.string().min(1, { message: 'Username tidak boleh kosong.' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong.' }),
});

export const GantiPasswordPesertaSchema = z.object({
  oldPassword: z.string().optional(),
  identifier: z.string().optional(),
  noWa: z.string().optional(),
  unit: z.string().optional(),
  asalSekolah: z.string().optional(),
  newPassword: z.string().regex(STRONG_PASSWORD_REGEX, {
    message: 'Password baru minimal 8 karakter kombinasi huruf besar, kecil, angka, dan simbol.',
  }),
});

export const LoginPanitiaSchema = z.object({
  username: z.string().min(1, { message: 'Username panitia wajib diisi.' }),
  password: z.string().min(1, { message: 'Password panitia wajib diisi.' }),
});

export const ScanQrSchema = z.object({
  idPeserta: z.string().min(1, { message: 'ID Peserta tidak boleh kosong.' }),
  mode: z.enum(['registrasi_ulang', 'berangkat', 'pulang', 'pulang_dari_lokasi', 'tiba_di_rumah']).optional(),
  keterangan: z.string().optional(),
});

// Schema untuk membuat akun panitia baru (Tahap 1)
// Dipakai oleh POST /api/peserta?resource=panitia
export const BuatAkunPanitiaSchema = z
  .object({
    namaLengkap: z
      .string()
      .min(2, { message: 'Nama lengkap minimal 2 karakter.' })
      .max(100, { message: 'Nama lengkap maksimal 100 karakter.' }),
    username: z.string().regex(USERNAME_REGEX, {
      message: 'Username harus 4-20 karakter alfanumerik atau underscore.',
    }),
    password: z.string().regex(STRONG_PASSWORD_REGEX, {
      message: 'Password minimal 8 karakter kombinasi huruf besar, kecil, angka, dan simbol.',
    }),
    role: z.enum(['SUPER_ADMIN', 'ADMIN_MOBIL'], {
      errorMap: () => ({ message: 'Role harus SUPER_ADMIN atau ADMIN_MOBIL.' }),
    }),
    mobil: z
      .string()
      .max(50, { message: 'Nama mobil maksimal 50 karakter.' })
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    // mobil wajib diisi (tidak boleh null/kosong) jika role adalah ADMIN_MOBIL
    if (data.role === 'ADMIN_MOBIL') {
      if (!data.mobil || data.mobil.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mobil'],
          message: 'Nama mobil wajib diisi untuk Admin Mobil.',
        });
      }
    }
  });

// Schema untuk membuat sesi kegiatan baru (Tahap 3)
// Dipakai oleh POST /api/peserta?resource=kegiatan
export const BuatKegiatanSchema = z.object({
  nama: z
    .string()
    .min(2, { message: 'Nama kegiatan minimal 2 karakter.' })
    .max(100, { message: 'Nama kegiatan maksimal 100 karakter.' }),
  deskripsi: z
    .string()
    .max(255, { message: 'Deskripsi kegiatan maksimal 255 karakter.' })
    .optional()
    .nullable(),
});

// Schema untuk mencatat absensi kegiatan (Tahap 3)
// Dipakai oleh POST /api/peserta?resource=absen_kegiatan
export const AbsenKegiatanSchema = z.object({
  kegiatanId: z.string().min(1, { message: 'ID Kegiatan wajib diisi.' }),
  idPeserta: z.string().min(1, { message: 'ID Peserta wajib diisi.' }),
});
