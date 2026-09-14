import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ScanQrSchema } from '@/lib/validation';
import { verifyRequestSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi Sesi Panitia
    const session = await verifyRequestSession(req, 'panitia');
    if (!session) {
      return NextResponse.json(
        { status: 'error', message: 'Akses ditolak. Fitur scanner hanya dapat digunakan oleh Panitia.' },
        { status: 401 }
      );
    }

    // 2. Validasi input
    const body = await req.json().catch(() => null);
    const validation = ScanQrSchema.safeParse(body);
    if (!validation.success) {
      const msg = validation.error.errors[0]?.message || 'Data scan tidak valid.';
      return NextResponse.json({ status: 'error', message: msg }, { status: 400 });
    }

    const { idPeserta, mode } = validation.data;
    const cleanId = idPeserta.trim().toUpperCase();

    // 3. Transaksi Prisma (mencegah race condition scanning serentak)
    const result = await prisma.$transaction(async (tx) => {
      // Cari peserta
      const peserta = await tx.peserta.findUnique({
        where: { idPeserta: cleanId },
      });

      if (!peserta) {
        throw new Error('NOT_FOUND');
      }

      if (peserta.partisipasi !== 'Ikut') {
        throw new Error('STATUS_TIDAK_IKUT');
      }

      const now = new Date();
      const keteranganLog = mode === 'berangkat' ? 'Scan Keberangkatan' : 'Scan Kepulangan';

      if (mode === 'berangkat') {
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
          keterangan: keteranganLog,
          waktuScan: now,
        },
      });

      return peserta;
    });

    return NextResponse.json({
      status: 'success',
      nama: result.namaLengkap,
      idPeserta: result.idPeserta,
      mode: mode,
      message: `Presensi ${mode === 'berangkat' ? 'keberangkatan' : 'kepulangan'} untuk ${result.namaLengkap} berhasil dicatat!`,
    });
  } catch (error: any) {
    if (error?.message === 'NOT_FOUND') {
      return NextResponse.json(
        { status: 'error', message: 'ID Peserta tidak terdaftar dalam sistem.' },
        { status: 404 }
      );
    }
    if (error?.message === 'STATUS_TIDAK_IKUT') {
      return NextResponse.json(
        { status: 'error', message: 'Peserta ini terdaftar dengan status "Tidak Ikut".' },
        { status: 400 }
      );
    }
    if (error?.message === 'ALREADY_SCANNED_BERANGKAT') {
      return NextResponse.json(
        { status: 'error', message: 'Peserta sudah tercatat presensi keberangkatan sebelumnya.' },
        { status: 409 }
      );
    }
    if (error?.message === 'ALREADY_SCANNED_PULANG') {
      return NextResponse.json(
        { status: 'error', message: 'Peserta sudah tercatat presensi kepulangan sebelumnya.' },
        { status: 409 }
      );
    }

    console.error('Error saat proses scan:', error);
    return NextResponse.json(
      { status: 'error', message: 'Terjadi kesalahan sistem saat memproses presensi scan.' },
      { status: 500 }
    );
  }
}
