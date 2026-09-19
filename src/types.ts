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

// Shape data peserta yang dipakai oleh seluruh UI (Dashboard, Daftar Peserta, dsb.)
// Catatan field: nama (bukan namaLengkap) — mapping dilakukan di apiService.ts
export interface PesertaRihlah {
  id: string;
  nama: string;
  namaLengkap?: string; // alias pendukung dari response backend agar tidak undefined
  jk: 'Laki-laki' | 'Perempuan';
  jenisKelamin?: 'Laki-laki' | 'Perempuan'; // alias backend
  unit: string;
  asalSekolah?: string;
  partisipasi: 'Ikut' | 'Tidak Ikut';
  alasan?: string;
  waPeserta?: string;
  waDarurat?: string;
  medis?: string;
  mobil?: string | null;
  idPeserta?: string;
  waktuBerangkat?: string;
  waktuPulang?: string;
  username?: string;
  statusPassword?: 'Wajib Ganti' | 'Selesai' | '-';
  hasSuratOrtu?: boolean;
  suratOrtuUrl?: string | null;
  deletedAt?: string | null;
}

export interface PesertaPublikItem {
  no: number;
  nama: string;
  unit: string;
  partisipasi: string;
  sudahBerangkat: boolean;
  sudahPulang: boolean;
}

export interface BuktiPendaftaranData {
  id: string;
  idPeserta: string;
  nama: string;
  jk: string;
  unit: string;
  partisipasi: string;
  mobil?: string | null;
  tanggalDaftar: string;
  generatedAt: string;
  verificationCode: string;
  qrPayload: string;
  officialIssuedAt?: string;
  panitiaContact?: string;
}

export interface DokumenRihlah {
  id: string;
  judul: string;
  scope: 'GLOBAL' | 'PERSONAL';
  idPeserta?: string | null;
  blobUrl: string;
  blobDownloadUrl: string;
  blobPathname: string;
  ukuranByte?: number | null;
  diunggahOleh?: string | null;
  createdAt: string;
  peserta?: {
    namaLengkap?: string;
    asalSekolah?: string;
  } | null;
}

export interface SystemLogEntry {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  action: string;
  actorId?: string | null;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface StatsRihlah {
  total: number;
  tidakIkut: number;
  berangkat: number;
  pulang: number;
  ikut?: number;
  sudahBerangkat?: number;
  sudahPulang?: number;
  pendaftaranDibuka?: boolean;
}

export type StatistikData = StatsRihlah;

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

// ─── API Response Types ──────────────────────────────────────────────────────
// Tipe-tipe ini menggantikan 'any' di apiService.ts agar type-safety terjaga
// dari layer HTTP response hingga ke komponen UI.

/** Interface generik standar untuk API */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: 'success' | 'error'; // properti penolong untuk kompatibilitas frontend
}

/** Response generik untuk operasi yang hanya perlu status + pesan */
export interface SimpleApiResponse extends ApiResponse<null> {
  status: 'success' | 'error';
  message?: string;
}

/** Response login peserta — berisi data minimal untuk state dashboard */
export interface LoginPesertaResponse extends ApiResponse<PesertaRihlah> {
  status: 'success' | 'error';
  message?: string;
  data?: PesertaRihlah;
}

/** Response dari endpoint /api/register */
export interface RegisterApiResponse extends ApiResponse<{ idPeserta?: string }> {
  status: 'success' | 'error';
  id?: string;
  message?: string;
}

/** Data hasil presensi scan */
export interface ScanResultData {
  nama?: string;
  idPeserta?: string;
}

/** Response dari endpoint /api/scan */
export interface ScanApiResponse extends ApiResponse<ScanResultData> {
  status: 'success' | 'error';
  nama?: string;
  idPeserta?: string;
  message?: string;
  unauthorized?: boolean;
}


/** Nilai kembalian terstruktur dari handleSubmitScan (App.tsx) ke komponen scanner.
 *  Menggantikan Promise<void> agar komponen dapat membedakan sukses vs gagal
 *  tanpa bergantung pada side-effect (toast) yang tidak terdeteksi dari luar. */
export interface ScanResult {
  success: boolean;
  message?: string;
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
