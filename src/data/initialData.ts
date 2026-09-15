// Skema database Supabase contoh untuk integrasi eksternal
// Digunakan oleh IntegrasiView.tsx

export const SAMPLE_SUPABASE_SQL = `-- SKEMA DATABASE SUPABASE (POSTGRESQL)
-- Giat Rihlah Paskibar Kecamatan Samarang
-- Salin dan jalankan di Supabase Dashboard -> SQL Editor

-- 1. Tabel Peserta Rihlah
CREATE TABLE IF NOT EXISTS public.rihlah_peserta (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  sekolah TEXT NOT NULL,
  tingkat TEXT NOT NULL,
  regu TEXT NOT NULL,
  no_hp TEXT,
  kontak_darurat TEXT,
  golongan_darah TEXT DEFAULT '-',
  riwayat_medis TEXT,
  ukuran_kaos TEXT DEFAULT 'L',
  status_bayar TEXT DEFAULT 'Belum Lunas',
  jumlah_bayar NUMERIC DEFAULT 0,
  total_iuran NUMERIC DEFAULT 150000,
  status_presensi TEXT DEFAULT 'Belum Hadir',
  waktu_presensi TIMESTAMP WITH TIME ZONE,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Keuangan & Iuran
CREATE TABLE IF NOT EXISTS public.rihlah_keuangan (
  id TEXT PRIMARY KEY,
  tanggal DATE DEFAULT CURRENT_DATE,
  tipe TEXT CHECK (tipe IN ('Pemasukan', 'Pengeluaran')),
  kategori TEXT NOT NULL,
  uraian TEXT NOT NULL,
  jumlah NUMERIC NOT NULL,
  pic TEXT NOT NULL,
  status TEXT DEFAULT 'Disetujui',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Rundown Acara
CREATE TABLE IF NOT EXISTS public.rihlah_rundown (
  id TEXT PRIMARY KEY,
  hari INT DEFAULT 1,
  waktu TEXT NOT NULL,
  nama_kegiatan TEXT NOT NULL,
  lokasi TEXT NOT NULL,
  penanggung_jawab TEXT NOT NULL,
  keterangan TEXT,
  status TEXT DEFAULT 'Mendatang'
);

-- 4. Enable Row Level Security (RLS) & Public Read/Write Access untuk Panitia
ALTER TABLE public.rihlah_peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rihlah_keuangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rihlah_rundown ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.rihlah_peserta FOR SELECT USING (true);
CREATE POLICY "Allow public write access" ON public.rihlah_peserta FOR ALL USING (true);

CREATE POLICY "Allow public read access keuangan" ON public.rihlah_keuangan FOR SELECT USING (true);
CREATE POLICY "Allow public write access keuangan" ON public.rihlah_keuangan FOR ALL USING (true);

CREATE POLICY "Allow public read access rundown" ON public.rihlah_rundown FOR SELECT USING (true);
CREATE POLICY "Allow public write access rundown" ON public.rihlah_rundown FOR ALL USING (true);
`;
