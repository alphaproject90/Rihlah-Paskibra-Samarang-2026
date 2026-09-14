import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRequestSession, PesertaSessionPayload } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const session = (await verifyRequestSession(req, 'peserta')) as PesertaSessionPayload | null;
    if (!session) {
      return NextResponse.json({ status: 'error', message: 'Sesi tidak valid.' }, { status: 401 });
    }

    const peserta = await prisma.peserta.findUnique({
      where: { idPeserta: session.idPeserta },
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

    if (!peserta) {
      return NextResponse.json({ status: 'error', message: 'Peserta tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      data: {
        id: peserta.idPeserta,
        nama: peserta.namaLengkap,
        jk: peserta.jenisKelamin,
        unit: peserta.asalSekolah,
        partisipasi: peserta.partisipasi,
        waktuBerangkat: peserta.waktuBerangkat ? peserta.waktuBerangkat.toISOString() : '',
        waktuPulang: peserta.waktuPulang ? peserta.waktuPulang.toISOString() : '',
        statusPassword: peserta.statusPassword,
      },
    });
  } catch (error) {
    console.error('Error saat memuat profil peserta:', error);
    return NextResponse.json({ status: 'error', message: 'Gagal memuat profil peserta.' }, { status: 500 });
  }
}
