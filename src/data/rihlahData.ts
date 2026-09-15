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

// INITIAL_PESERTA_RIHLAH dihapus.
// Alasannya: data itu sudah tidak dipakai setelah fallback diam-diam di
// apiService dibuang, tapi tetap ikut ter-bundle dan terkirim ke browser —
// termasuk nomor WhatsApp contoh dan field passwordHash berisi teks biasa.
// Kalau nanti butuh data contoh untuk testing, taruh di file fixture terpisah
// yang tidak di-import oleh kode produksi.
