import { PesertaRihlah } from '../types';

export const DAFTAR_SEKOLAH = [
  "SMAN 17 Garut",
  "SMA Plus Akhfa",
  "SMK Plus Qurrota’ayun",
  "SMA Nurul Amin",
  "MTS Nurul Amin",
  "SMK Tunas Nusantara",
  "SMPN I Samarang",
  "SMK As salam",
  "SMK Al Madani",
  "SMK Al Amin"
];

export const INITIAL_PESERTA_RIHLAH: PesertaRihlah[] = [
  {
    id: 'PASK-A1',
    nama: 'Abdul Fatah',
    jk: 'Laki-laki',
    unit: 'SMAN 17 Garut',
    partisipasi: 'Ikut',
    waktuBerangkat: '14/09/2026 06:15:02',
    waktuPulang: '',
    waPeserta: '081234567891',
    waDarurat: '081298765432',
    medis: 'Tidak ada',
    username: 'abdulf',
    passwordSalt: 'salt123',
    passwordHash: 'rihlah2026',
    statusPassword: 'Wajib Ganti'
  },
  {
    id: 'PASK-B2',
    nama: 'Citra Lestari',
    jk: 'Perempuan',
    unit: 'SMAN 17 Garut',
    partisipasi: 'Ikut',
    waktuBerangkat: '',
    waktuPulang: '',
    waPeserta: '082123456780',
    waDarurat: '085233445566',
    medis: 'Alergi dingin ringan',
    username: 'citral',
    passwordSalt: 'salt456',
    passwordHash: 'Rihlah@2026',
    statusPassword: 'Selesai'
  },
  {
    id: 'PASK-C3',
    nama: 'Dedi Kurniawan',
    jk: 'Laki-laki',
    unit: 'SMA Plus Akhfa',
    partisipasi: 'Ikut',
    waktuBerangkat: '14/09/2026 06:10:44',
    waktuPulang: '14/09/2026 16:32:10',
    waPeserta: '087812345678',
    waDarurat: '087899887766',
    medis: 'Asma',
    username: 'dedik',
    passwordSalt: 'salt789',
    passwordHash: 'Rihlah@2026',
    statusPassword: 'Selesai'
  },
  {
    id: 'TIDAK-IKUT',
    nama: 'Budi S',
    jk: 'Laki-laki',
    unit: 'SMA Plus Akhfa',
    partisipasi: 'Tidak Ikut',
    alasan: 'Ada acara keluarga mendesak',
    waktuBerangkat: '',
    waktuPulang: '',
    waPeserta: '-',
    waDarurat: '-',
    medis: '-',
    username: '-',
    statusPassword: '-'
  }
];
