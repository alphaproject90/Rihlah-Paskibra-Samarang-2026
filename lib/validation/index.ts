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
  newPassword: z.string().regex(STRONG_PASSWORD_REGEX, {
    message: 'Password baru minimal 8 karakter kombinasi huruf besar, kecil, angka, dan simbol.',
  }),
});

export const LoginPanitiaSchema = z.object({
  pin: z.string().min(4, { message: 'PIN panitia minimal 4 digit.' }),
});

export const ScanQrSchema = z.object({
  idPeserta: z.string().min(1, { message: 'ID Peserta tidak boleh kosong.' }),
  mode: z.enum(['berangkat', 'pulang'], {
    errorMap: () => ({ message: 'Mode presensi harus "berangkat" atau "pulang".' }),
  }),
});
