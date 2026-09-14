import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRequestSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    // 1. Verifikasi Sesi Panitia
    const session = await verifyRequestSession(req, 'panitia');
    if (!session) {
      return NextResponse.json(
        { status: 'error', message: 'Akses ditolak. Sesi panitia tidak valid.' },
        { status: 401 }
      );
    }

    // 2. Ambil seluruh data peserta dari PostgreSQL
    // EXCLUDE passwordHash secara eksplisit untuk menjamin keamanan!
    const listPeserta = await prisma.peserta.findMany({
      select: {
        id: true,
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
        // TIDAK MENYERTAKAN passwordHash!
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedData = listPeserta.map((p) => ({
      id: p.idPeserta,
      nama: p.namaLengkap,
      jk: p.jenisKelamin,
      unit: p.asalSekolah,
      partisipasi: p.partisipasi,
      alasan: p.alasanTidakIkut || '',
      waPeserta: p.waPribadi || '',
      waDarurat: p.waDarurat || '',
      medis: p.riwayatMedis || '',
      waktuBerangkat: p.waktuBerangkat ? p.waktuBerangkat.toISOString() : '',
      waktuPulang: p.waktuPulang ? p.waktuPulang.toISOString() : '',
      username: p.username || '',
      statusPassword: p.statusPassword || 'Selesai',
    }));

    return NextResponse.json({
      status: 'success',
      data: formattedData,
    });
  } catch (error) {
    console.error('Error saat mengambil data peserta:', error);
    return NextResponse.json(
      { status: 'error', message: 'Gagal mengambil data peserta. Silakan coba kembali.' },
      { status: 500 }
    );
  }
}
