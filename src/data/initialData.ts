import { Peserta, RundownItem, ReguInfo, TransaksiKeuangan, LogistikItem, ConfigIntegrasi } from '../types';

export const INITIAL_PESERTA: Peserta[] = [
  {
    id: 'PKB-SMG-001',
    nama: 'Rizky Pratama Ramadhan',
    sekolah: 'SMAN 1 Samarang',
    tingkat: 'Paskibra Inti',
    regu: 'Regu Garuda',
    noHp: '081234567891',
    kontakDarurat: '081298765432 (Ibu Suminar)',
    golonganDarah: 'O',
    riwayatMedis: 'Tidak ada',
    ukuranKaos: 'L',
    statusBayar: 'Lunas',
    jumlahBayar: 150000,
    totalIuran: 150000,
    statusPresensi: 'Hadir',
    waktuPresensi: '2026-09-14 06:45',
    catatan: 'Danton Peleton 1',
    createdAt: '2026-09-10'
  },
  {
    id: 'PKB-SMG-002',
    nama: 'Nabila Nur Azizah',
    sekolah: 'SMAN 1 Samarang',
    tingkat: 'Capas',
    regu: 'Regu Garuda',
    noHp: '082123456780',
    kontakDarurat: '085233445566 (Ayah - H. Deden)',
    golonganDarah: 'A',
    riwayatMedis: 'Alergi dingin ringan',
    ukuranKaos: 'M',
    statusBayar: 'Lunas',
    jumlahBayar: 150000,
    totalIuran: 150000,
    statusPresensi: 'Hadir',
    waktuPresensi: '2026-09-14 06:50',
    catatan: 'Regu Pengibar',
    createdAt: '2026-09-10'
  },
  {
    id: 'PKB-SMG-003',
    nama: 'Fahmi Khoirul Anwar',
    sekolah: 'SMKN 1 Garut (Samarang)',
    tingkat: 'Paskibra Inti',
    regu: 'Regu Rajawali',
    noHp: '085712345678',
    kontakDarurat: '085799887766 (Ibu Enok)',
    golonganDarah: 'B',
    riwayatMedis: 'Tidak ada',
    ukuranKaos: 'XL',
    statusBayar: 'Lunas',
    jumlahBayar: 150000,
    totalIuran: 150000,
    statusPresensi: 'Hadir',
    waktuPresensi: '2026-09-14 07:02',
    catatan: 'Ketua Regu Rajawali',
    createdAt: '2026-09-11'
  },
  {
    id: 'PKB-SMG-004',
    nama: 'Siti Rahmawati Putri',
    sekolah: 'MA Nurul Huda Samarang',
    tingkat: 'Capas',
    regu: 'Regu Rajawali',
    noHp: '083812349900',
    kontakDarurat: '083844556677 (Kakak - Asep)',
    golonganDarah: 'AB',
    riwayatMedis: 'Maag (bawa obat pribadi)',
    ukuranKaos: 'S',
    statusBayar: 'Cicil',
    jumlahBayar: 100000,
    totalIuran: 150000,
    statusPresensi: 'Belum Hadir',
    catatan: 'Sisa iuran Rp 50.000',
    createdAt: '2026-09-11'
  },
  {
    id: 'PKB-SMG-005',
    nama: 'Dimas Bagas Aditia',
    sekolah: 'SMK Patriot Samarang',
    tingkat: 'Paskibra Inti',
    regu: 'Regu Komodo',
    noHp: '089612345678',
    kontakDarurat: '089677889900 (Orang Tua)',
    golonganDarah: 'O',
    riwayatMedis: 'Tidak ada',
    ukuranKaos: 'L',
    statusBayar: 'Lunas',
    jumlahBayar: 150000,
    totalIuran: 150000,
    statusPresensi: 'Hadir',
    waktuPresensi: '2026-09-14 06:40',
    catatan: 'Koordinator Perlengkapan',
    createdAt: '2026-09-09'
  },
  {
    id: 'PKB-SMG-006',
    nama: 'Annisa Fitriani',
    sekolah: 'SMAN 1 Samarang',
    tingkat: 'Capas',
    regu: 'Regu Komodo',
    noHp: '081398765432',
    kontakDarurat: '081322334455 (Ibu Ai)',
    golonganDarah: 'B',
    riwayatMedis: 'Asma ringan (inhaler siap)',
    ukuranKaos: 'M',
    statusBayar: 'Lunas',
    jumlahBayar: 150000,
    totalIuran: 150000,
    statusPresensi: 'Belum Hadir',
    catatan: 'Didampingi medis',
    createdAt: '2026-09-11'
  },
  {
    id: 'PKB-SMG-007',
    nama: 'Muhammad Alfin Syahputra',
    sekolah: 'SMKN 1 Garut (Samarang)',
    tingkat: 'Panitia',
    regu: 'Regu Elang',
    noHp: '082211447788',
    kontakDarurat: '082299881122 (Ayah - Pak Yadi)',
    golonganDarah: 'O',
    riwayatMedis: 'Tidak ada',
    ukuranKaos: 'XL',
    statusBayar: 'Lunas',
    jumlahBayar: 150000,
    totalIuran: 150000,
    statusPresensi: 'Hadir',
    waktuPresensi: '2026-09-14 06:15',
    catatan: 'Sie Acara & Dokumentasi',
    createdAt: '2026-09-08'
  },
  {
    id: 'PKB-SMG-008',
    nama: 'Dewi Lestari Kusuma',
    sekolah: 'MA Nurul Huda Samarang',
    tingkat: 'Purna',
    regu: 'Regu Elang',
    noHp: '085299112233',
    kontakDarurat: '085277889900 (Keluarga)',
    golonganDarah: 'A',
    riwayatMedis: 'Tidak ada',
    ukuranKaos: 'L',
    statusBayar: 'Lunas',
    jumlahBayar: 150000,
    totalIuran: 150000,
    statusPresensi: 'Hadir',
    waktuPresensi: '2026-09-14 06:30',
    catatan: 'Instruktur Materi PBB',
    createdAt: '2026-09-08'
  },
  {
    id: 'PKB-SMG-009',
    nama: 'Rendra Hendrawan',
    sekolah: 'SMAN 1 Samarang',
    tingkat: 'Capas',
    regu: 'Regu Badak',
    noHp: '087812345670',
    kontakDarurat: '087899001122 (Ibu Tati)',
    golonganDarah: 'O',
    riwayatMedis: 'Tidak ada',
    ukuranKaos: 'L',
    statusBayar: 'Belum Lunas',
    jumlahBayar: 50000,
    totalIuran: 150000,
    statusPresensi: 'Izin',
    catatan: 'Izin terlambat 1 jam ada ujian',
    createdAt: '2026-09-12'
  },
  {
    id: 'PKB-SMG-010',
    nama: 'Salsabila Zahra',
    sekolah: 'SMPN 1 Samarang',
    tingkat: 'Capas',
    regu: 'Regu Cendrawasih',
    noHp: '081912348899',
    kontakDarurat: '081966554433 (Ayah - Pak Iman)',
    golonganDarah: 'AB',
    riwayatMedis: 'Tidak ada',
    ukuranKaos: 'S',
    statusBayar: 'Lunas',
    jumlahBayar: 150000,
    totalIuran: 150000,
    statusPresensi: 'Hadir',
    waktuPresensi: '2026-09-14 06:48',
    catatan: 'Anggota Perintis',
    createdAt: '2026-09-10'
  }
];

export const INITIAL_RUNDOWN: RundownItem[] = [
  {
    id: 'RD-01',
    hari: 1,
    waktu: '06:00 - 07:00',
    namaKegiatan: 'Registrasi Ulang & Check-In Peserta',
    lokasi: 'Plaza Kecamatan Samarang',
    penanggungJawab: 'Sie Kesekretariatan',
    keterangan: 'Pemeriksaan identitas, scan QR ID Card, & cek kesehatan',
    status: 'Selesai'
  },
  {
    id: 'RD-02',
    hari: 1,
    waktu: '07:00 - 08:00',
    namaKegiatan: 'Apel Pelepasan & Doa Bersama',
    lokasi: 'Lapangan Kantor Kecamatan Samarang',
    penanggungJawab: 'Ketua PPI Samarang & Muspika',
    keterangan: 'Pelepasan resmi oleh Pembina Paskibra Kecamatan Samarang',
    status: 'Sedang Berlangsung'
  },
  {
    id: 'RD-03',
    hari: 1,
    waktu: '08:00 - 09:30',
    namaKegiatan: 'Pemberangkatan & Konvoi Rihlah',
    lokasi: 'Rute Samarang -> Bumi Perkemahan Kamojang',
    penanggungJawab: 'Sie Transportasi & Keamanan',
    keterangan: 'Konvoi tertib dengan armada bus & pengawalan relawan',
    status: 'Mendatang'
  },
  {
    id: 'RD-04',
    hari: 1,
    waktu: '09:30 - 11:30',
    namaKegiatan: 'Pendirian Tenda & Orientasi Medan',
    lokasi: 'Kawasan Wisata Alam Kamojang Camping Ground',
    penanggungJawab: 'Koordinator Regu & Logistik',
    keterangan: 'Pemasangan tenda dome regu, penataan barak, dan sanitasi',
    status: 'Mendatang'
  },
  {
    id: 'RD-05',
    hari: 1,
    waktu: '11:30 - 13:00',
    namaKegiatan: 'Ishoma (Istirahat, Shalat Dzuhur, & Makan Siang)',
    lokasi: 'Musholla & Tenda Utama',
    penanggungJawab: 'Sie Konsumsi & Rohis',
    keterangan: 'Makan bersama tertib komando paskibra',
    status: 'Mendatang'
  },
  {
    id: 'RD-06',
    hari: 1,
    waktu: '13:00 - 15:30',
    namaKegiatan: 'Games Kepemimpinan & PBB Formasi Kreasi Alam',
    lokasi: 'Lapangan Terbuka Kamojang',
    penanggungJawab: 'Instruktur Purna Paskibra',
    keterangan: 'Latihan kekompakan formasi, kedisiplinan dan dinamika regu',
    status: 'Mendatang'
  },
  {
    id: 'RD-07',
    hari: 1,
    waktu: '19:30 - 22:30',
    namaKegiatan: 'Malam Keakraban, Api Unggun & Renungan Jiwa',
    lokasi: 'Pusat Api Unggun Perkemahan',
    penanggungJawab: 'Ketua Panitia & Senior Paskibra',
    keterangan: 'Ikrar Paskibra, pentas seni regu, dan tadabbur kebangsaan',
    status: 'Mendatang'
  },
  {
    id: 'RD-08',
    hari: 2,
    waktu: '04:30 - 06:00',
    namaKegiatan: 'Shalat Subuh Berjamaah & Kultum Spiritual',
    lokasi: 'Musholla Perkemahan',
    penanggungJawab: 'Sie Rohis',
    keterangan: 'Penyegaran rohani dan pembentukan karakter insan beriman',
    status: 'Mendatang'
  },
  {
    id: 'RD-09',
    hari: 2,
    waktu: '06:00 - 08:30',
    namaKegiatan: 'Senam Komando Paskibar & Sarapan Pagi',
    lokasi: 'Area Terbuka Kamojang',
    penanggungJawab: 'Sie Acara & Konsumsi',
    keterangan: 'Peregangan fisik dan asupan nutrisi pagi',
    status: 'Mendatang'
  },
  {
    id: 'RD-10',
    hari: 2,
    waktu: '08:30 - 11:00',
    namaKegiatan: 'Jelajah Alam / Tadabbur Alam & Bakti Lingkungan',
    lokasi: 'Jalur Geotermal & Hutan Lindung Kamojang',
    penanggungJawab: 'Sie Lapangan & Medis',
    keterangan: 'Operasi semut bersih sampah & jelajah kekayaan alam Garut',
    status: 'Mendatang'
  },
  {
    id: 'RD-11',
    hari: 2,
    waktu: '13:00 - 14:30',
    namaKegiatan: 'Apel Penutupan, Penghargaan Regu Terbaik & Kembali',
    lokasi: 'Bumi Perkemahan Kamojang',
    penanggungJawab: 'Pembina Paskibar Samarang',
    keterangan: 'Penyerahan plakat penghargaan regu teladan & kembali ke Samarang',
    status: 'Mendatang'
  }
];

export const INITIAL_REGU: ReguInfo[] = [
  {
    id: 'regu-1',
    namaRegu: 'Regu Garuda',
    ketuaRegu: 'Rizky Pratama (SMAN 1 Samarang)',
    nomorTenda: 'Tenda A-01 (Kubah Merah)',
    warnaBendera: '#ef4444',
    semboyan: 'Garuda di Dadaku, Disiplin Jiwaku!',
    kapasitas: 8
  },
  {
    id: 'regu-2',
    namaRegu: 'Regu Rajawali',
    ketuaRegu: 'Fahmi Khoirul (SMKN 1 Garut Samarang)',
    nomorTenda: 'Tenda A-02 (Kubah Biru)',
    warnaBendera: '#3b82f6',
    semboyan: 'Terbang Tinggi Menggapai Prestasi!',
    kapasitas: 8
  },
  {
    id: 'regu-3',
    namaRegu: 'Regu Komodo',
    ketuaRegu: 'Dimas Bagas (SMK Patriot Samarang)',
    nomorTenda: 'Tenda B-01 (Kubah Hijau)',
    warnaBendera: '#10b981',
    semboyan: 'Tangguh, Berani, Pantang Menyerah!',
    kapasitas: 8
  },
  {
    id: 'regu-4',
    namaRegu: 'Regu Elang',
    ketuaRegu: 'M. Alfin Syahputra (Panitia)',
    nomorTenda: 'Tenda B-02 (Kubah Kuning)',
    warnaBendera: '#f59e0b',
    semboyan: 'Tajam Penglihatan, Kokoh Pendirian!',
    kapasitas: 8
  },
  {
    id: 'regu-5',
    namaRegu: 'Regu Badak',
    ketuaRegu: 'Rendra Hendrawan',
    nomorTenda: 'Tenda C-01 (Kubah Oranye)',
    warnaBendera: '#f97316',
    semboyan: 'Kuat Menopang, Pantang Mundur!',
    kapasitas: 8
  },
  {
    id: 'regu-6',
    namaRegu: 'Regu Cendrawasih',
    ketuaRegu: 'Salsabila Zahra (SMPN 1 Samarang)',
    nomorTenda: 'Tenda C-02 (Kubah Ungu)',
    warnaBendera: '#8b5cf6',
    semboyan: 'Anggun Berakhlak, Unggul Berkarya!',
    kapasitas: 8
  }
];

export const INITIAL_KEUANGAN: TransaksiKeuangan[] = [
  {
    id: 'TRX-001',
    tanggal: '2026-09-05',
    tipe: 'Pemasukan',
    kategori: 'Kas Paskibar',
    uraian: 'Alokasi Dana Kas Kasir Paskibar Kec. Samarang',
    jumlah: 1500000,
    pic: 'Bendahara Umum',
    status: 'Disetujui'
  },
  {
    id: 'TRX-002',
    tanggal: '2026-09-08',
    tipe: 'Pemasukan',
    kategori: 'Sponsor / Donatur',
    uraian: 'Bantuan Pembina & Alumni Purna Samarang',
    jumlah: 2000000,
    pic: 'Kak Rina (Purna 2020)',
    status: 'Disetujui'
  },
  {
    id: 'TRX-003',
    tanggal: '2026-09-12',
    tipe: 'Pemasukan',
    kategori: 'Iuran Peserta',
    uraian: 'Pembayaran Iuran 10 Peserta Gelombang 1',
    jumlah: 1400000,
    pic: 'Sie Keuangan',
    status: 'Disetujui'
  },
  {
    id: 'TRX-004',
    tanggal: '2026-09-10',
    tipe: 'Pengeluaran',
    kategori: 'Transport & Armada',
    uraian: 'DP Sewa 2 Unit Armada Bus Elf Samarang-Kamojang',
    jumlah: 1600000,
    pic: 'Sie Transport',
    status: 'Disetujui'
  },
  {
    id: 'TRX-005',
    tanggal: '2026-09-11',
    tipe: 'Pengeluaran',
    kategori: 'Sewa Tenda & Lokasi',
    uraian: 'Tiket Masuk Camp Ground & Kebersihan Kawasan',
    jumlah: 850000,
    pic: 'Sie Lapangan',
    status: 'Disetujui'
  },
  {
    id: 'TRX-006',
    tanggal: '2026-09-13',
    tipe: 'Pengeluaran',
    kategori: 'Konsumsi',
    uraian: 'Belanja Logistik Dapur Umum & Snack Pelepasan',
    jumlah: 950000,
    pic: 'Sie Konsumsi',
    status: 'Disetujui'
  },
  {
    id: 'TRX-007',
    tanggal: '2026-09-13',
    tipe: 'Pengeluaran',
    kategori: 'Dokumentasi & ID Card',
    uraian: 'Cetak ID Card Lanyard, Pin Rihlah, & Banner Utama',
    jumlah: 450000,
    pic: 'Sie Dokumentasi',
    status: 'Disetujui'
  }
];

export const INITIAL_LOGISTIK: LogistikItem[] = [
  { id: 'LOG-01', namaBarang: 'Bendera Merah Putih & Tiang Portable', kategori: 'Panitia', jumlah: '2 Set', status: 'Siap', pic: 'Sie Upacara' },
  { id: 'LOG-02', namaBarang: 'Kotak P3K Lengkap & Oksigen Kaleng', kategori: 'Panitia', jumlah: '3 Kotak', status: 'Siap', pic: 'Sie Medis' },
  { id: 'LOG-03', namaBarang: 'Megaphone Portable & Baterai Cadangan', kategori: 'Panitia', jumlah: '2 Unit', status: 'Siap', pic: 'Sie Acara' },
  { id: 'LOG-04', namaBarang: 'Tenda Dome Kapasitas 6-8 Orang', kategori: 'Regu', jumlah: '6 Tenda', status: 'Siap', pic: 'Koordinator Regu' },
  { id: 'LOG-05', namaBarang: 'Kayu Bakar Api Unggun & Minyak Tanah', kategori: 'Panitia', jumlah: '3 Ikat Besar', status: 'Proses', pic: 'Sie Lapangan' },
  { id: 'LOG-06', namaBarang: 'Matras Pribadi & Sleeping Bag Peserta', kategori: 'Pribadi', jumlah: 'Wajib Tiap Peserta', status: 'Siap', pic: 'Masing-masing' },
  { id: 'LOG-07', namaBarang: 'Genset & Lampu Sorot LED Lapangan', kategori: 'Panitia', jumlah: '1 Unit + Kabel', status: 'Siap', pic: 'Sie Logistik' }
];

export const INITIAL_CONFIG: ConfigIntegrasi = {
  spreadsheetId: '',
  sheetName: 'Peserta_Rihlah_Samarang',
  supabaseUrl: '',
  supabaseAnonKey: '',
  autoSync: false
};

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
