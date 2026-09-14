// Tipe untuk Arsitektur Giat Rihlah Paskibra Samarang
export type HalamanType = 
  | 'home'
  | 'daftar'
  | 'login-pilihan'
  | 'login-peserta'
  | 'ganti-password'
  | 'dashboard-peserta'
  | 'peserta'
  | 'login-panitia'
  | 'scanner';

export interface PesertaRihlah {
  id: string;
  nama: string;
  jk: 'Laki-laki' | 'Perempuan';
  unit: string;
  partisipasi: 'Ikut' | 'Tidak Ikut';
  alasan?: string;
  waPeserta?: string;
  waDarurat?: string;
  medis?: string;
  waktuBerangkat?: string;
  waktuPulang?: string;
  username?: string;
  passwordHash?: string;
  passwordSalt?: string;
  statusPassword?: 'Wajib Ganti' | 'Selesai' | '-';
}

export interface StatsRihlah {
  total: number;
  tidakIkut: number;
  berangkat: number;
  pulang: number;
}

export interface FormPendaftaran {
  nama: string;
  jk: 'Laki-laki' | 'Perempuan';
  unit: string;
  partisipasi: 'Ikut' | 'Tidak Ikut';
  alasan: string;
  waPeserta: string;
  waDarurat: string;
  medis: string;
  username: string;
  password: string;
  konfirmasiPassword: string;
  setujuKirimWa: boolean;
}

export interface NotifState {
  show: boolean;
  message: string;
  type: 'info' | 'success' | 'error';
}

// Tipe pendukung / interoperabilitas
export type TingkatPeserta = 'Capas' | 'Paskibra Inti' | 'Purna' | 'Panitia' | 'Pembina';
export type StatusBayar = 'Lunas' | 'Belum Lunas' | 'Cicil';
export type StatusPresensi = 'Hadir' | 'Belum Hadir' | 'Izin' | 'Sakit';
export type GolonganDarah = 'A' | 'B' | 'AB' | 'O' | '-';
export type UkuranKaos = 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';

export interface Peserta {
  id: string;
  nama: string;
  sekolah: string;
  tingkat: TingkatPeserta;
  regu: string;
  noHp: string;
  kontakDarurat: string;
  golonganDarah: GolonganDarah;
  riwayatMedis: string;
  ukuranKaos: UkuranKaos;
  statusBayar: StatusBayar;
  jumlahBayar: number;
  totalIuran: number;
  statusPresensi: StatusPresensi;
  waktuPresensi?: string;
  catatan?: string;
  createdAt: string;
}

export interface RundownItem {
  id: string;
  hari: number;
  waktu: string;
  namaKegiatan: string;
  lokasi: string;
  penanggungJawab: string;
  keterangan: string;
  status: 'Selesai' | 'Sedang Berlangsung' | 'Mendatang';
}

export interface ReguInfo {
  id: string;
  namaRegu: string;
  ketuaRegu: string;
  nomorTenda: string;
  warnaBendera: string;
  semboyan: string;
  kapasitas: number;
}

export interface TransaksiKeuangan {
  id: string;
  tanggal: string;
  tipe: 'Pemasukan' | 'Pengeluaran';
  kategori: string;
  uraian: string;
  jumlah: number;
  pic: string;
  status: 'Disetujui' | 'Menunggu';
}

export interface LogistikItem {
  id: string;
  namaBarang: string;
  kategori: string;
  jumlah: number | string;
  satuan?: string;
  penanggungJawab?: string;
  status: 'Tersedia' | 'Dipinjam' | 'Kurang' | 'Siap' | 'Proses' | string;
  pic?: string;
}

export interface ConfigIntegrasi {
  googleSheetsUrl?: string;
  spreadsheetId?: string;
  sheetName?: string;
  autoSync?: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  autoSyncSupabase?: boolean;
  lastSync?: string;
}

export interface PresensiLog {
  id: string;
  pesertaId: string;
  nama: string;
  regu: string;
  waktu: string;
  metode: string;
  sesi?: string;
}
