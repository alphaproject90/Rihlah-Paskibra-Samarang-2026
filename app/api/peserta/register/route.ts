import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RegisterPesertaSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ status: 'error', message: 'Payload tidak valid.' }, { status: 400 });
    }

    const validation = RegisterPesertaSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || 'Data pendaftaran tidak valid.';
      return NextResponse.json({ status: 'error', message: firstError }, { status: 400 });
    }

    const data = validation.data;
    const isIkut = data.partisipasi === 'Ikut';

    // Transaksi Prisma untuk mencegah race condition
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek duplikasi username jika Ikut
      if (isIkut && data.username) {
        const usernameClean = data.username.trim().toLowerCase();
        const existingUser = await tx.peserta.findUnique({
          where: { username: usernameClean },
        });
        if (existingUser) {
          throw new Error('DUPLICATE_USERNAME');
        }
      }

      // 2. Generate ID Peserta
      let newIdPeserta = '';
      if (isIkut) {
        const countIkut = await tx.peserta.count({
          where: { partisipasi: 'Ikut' },
        });
        newIdPeserta = `PASK-${String(countIkut + 1).padStart(4, '0')}`;
        // Pastikan unik jika sebelumnya ada delete
        let exists = await tx.peserta.findUnique({ where: { idPeserta: newIdPeserta } });
        let suffix = 1;
        while (exists) {
          newIdPeserta = `PASK-${String(countIkut + 1 + suffix).padStart(4, '0')}`;
          exists = await tx.peserta.findUnique({ where: { idPeserta: newIdPeserta } });
          suffix++;
        }
      } else {
        const countTidak = await tx.peserta.count({
          where: { partisipasi: 'Tidak Ikut' },
        });
        newIdPeserta = `TIDAK-IKUT-${String(countTidak + 1).padStart(4, '0')}`;
      }

      // 3. Hash password dengan bcrypt
      let passwordHashed: string | null = null;
      if (isIkut && data.password) {
        passwordHashed = await hashPassword(data.password);
      }

      // 4. Simpan ke database
      const pesertaBaru = await tx.peserta.create({
        data: {
          idPeserta: newIdPeserta,
          namaLengkap: data.nama.trim(),
          jenisKelamin: data.jk,
          asalSekolah: data.unit.trim(),
          partisipasi: data.partisipasi,
          alasanTidakIkut: isIkut ? null : data.alasan?.trim(),
          waPribadi: isIkut ? data.waPeserta?.trim() : null,
          waDarurat: isIkut ? data.waDarurat?.trim() : null,
          riwayatMedis: isIkut ? (data.medis?.trim() || '-') : null,
          username: isIkut && data.username ? data.username.trim().toLowerCase() : null,
          passwordHash: passwordHashed,
          statusPassword: isIkut ? 'Selesai' : null,
        },
      });

      return pesertaBaru;
    });

    return NextResponse.json({
      status: 'success',
      id: result.idPeserta,
      message: 'Pendaftaran berhasil disimpan!',
    });
  } catch (error: any) {
    if (error?.message === 'DUPLICATE_USERNAME' || error?.code === 'P2002') {
      return NextResponse.json(
        { status: 'error', message: 'Username sudah digunakan. Silakan pilih username lain.' },
        { status: 400 }
      );
    }
    console.error('Error saat registerPeserta:', error);
    return NextResponse.json(
      { status: 'error', message: 'Terjadi kesalahan sistem saat mendaftar. Silakan coba kembali.' },
      { status: 500 }
    );
  }
}
