import {
  FormPendaftaran,
  PesertaRihlah,
  StatsRihlah,
  StatistikData,
  ApiResponse,
  LoginPesertaResponse,
  RegisterApiResponse,
  SimpleApiResponse,
  ScanApiResponse,
} from '../types';

export interface HasilApi<T> {
  ok: boolean;
  data: T;
  message?: string;
  unauthorized?: boolean;
}

const PESAN_KONEKSI = 'Gagal terhubung ke server. Periksa koneksi Anda.';

async function bacaJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Type guard — pastikan value dari bacaJson adalah object sebelum akses properti.
 * Ini menggantikan pola unsafe `json?.someKey` yang sebelumnya pakai 'any'.
 */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export const apiService = {
  getStatistik: async (): Promise<ApiResponse<StatistikData> & { ok: boolean }> => {
    try {
      const res = await fetch('/api/statistik');
      const json = await bacaJson(res);

      if (!res.ok) {
        const errorMsg = isObject(json)
          ? String(json.message || json.error || `Gagal memuat statistik (${res.status}).`)
          : `Gagal memuat statistik (${res.status}).`;
        return {
          success: false,
          status: 'error',
          ok: false,
          error: errorMsg,
          message: errorMsg,
          data: { total: 0, tidakIkut: 0, berangkat: 0, pulang: 0 },
        };
      }

      // Handle bila response dibungkus dalam { success, data: { ... } } atau raw object { total, ... }
      let rawData: Record<string, unknown> | null = null;
      if (isObject(json)) {
        if (isObject(json.data)) {
          rawData = json.data;
        } else if ('total' in json || 'berangkat' in json || 'ikut' in json) {
          rawData = json;
        }
      }

      if (!rawData) {
        const errorMsg = isObject(json)
          ? String(json.message || json.error || 'Data statistik tidak valid.')
          : `Gagal memuat statistik (${res.status}).`;
        return {
          success: false,
          status: 'error',
          ok: false,
          error: errorMsg,
          message: errorMsg,
          data: { total: 0, tidakIkut: 0, berangkat: 0, pulang: 0 },
        };
      }

      // Petakan properti .data dari respons server ke tipe StatistikData
      const mappedStats: StatistikData = {
        total: Number(rawData.total ?? rawData.ikut ?? 0),
        tidakIkut: Number(rawData.tidakIkut ?? 0),
        berangkat: Number(rawData.berangkat ?? rawData.sudahBerangkat ?? 0),
        pulang: Number(rawData.pulang ?? rawData.sudahPulang ?? 0),
        ikut: Number(rawData.ikut ?? rawData.total ?? 0),
        sudahBerangkat: Number(rawData.sudahBerangkat ?? rawData.berangkat ?? 0),
        sudahPulang: Number(rawData.sudahPulang ?? rawData.pulang ?? 0),
      };

      return {
        success: true,
        status: 'success',
        ok: true,
        data: mappedStats,
        message: 'Statistik berhasil dimuat',
      };
    } catch {
      return {
        success: false,
        status: 'error',
        ok: false,
        error: PESAN_KONEKSI,
        message: PESAN_KONEKSI,
        data: { total: 0, tidakIkut: 0, berangkat: 0, pulang: 0 },
      };
    }
  },

  getAllPeserta: async (): Promise<HasilApi<PesertaRihlah[]>> => {
    try {
      const res = await fetch('/api/peserta');
      const json = await bacaJson(res);

      if (res.status === 401) {
        const msg = isObject(json) ? String(json.error || '') : '';
        return { ok: false, data: [], unauthorized: true, message: msg || 'Sesi panitia tidak valid.' };
      }
      if (!res.ok || !isObject(json) || !json.success) {
        const msg = isObject(json) ? String(json.error || '') : '';
        return { ok: false, data: [], message: msg || `Gagal memuat data (${res.status}).` };
      }

      // API mengembalikan field DB (namaLengkap, asalSekolah, dll.)
      // Map ke shape PesertaRihlah yang dipakai frontend
      const raw = Array.isArray(json.data) ? json.data : [];
      const mapped: PesertaRihlah[] = raw.map((p: Record<string, unknown>) => ({
        id: String(p.idPeserta ?? ''),
        nama: String(p.namaLengkap ?? ''),
        namaLengkap: String(p.namaLengkap ?? ''),
        jk: (p.jenisKelamin as PesertaRihlah['jk']) ?? 'Laki-laki',
        unit: String(p.asalSekolah ?? ''),
        partisipasi: (p.partisipasi as PesertaRihlah['partisipasi']) ?? 'Tidak Ikut',
        alasan: p.alasanTidakIkut ? String(p.alasanTidakIkut) : undefined,
        waPeserta: p.waPribadi ? String(p.waPribadi) : undefined,
        waDarurat: p.waDarurat ? String(p.waDarurat) : undefined,
        medis: p.riwayatMedis ? String(p.riwayatMedis) : undefined,
        waktuBerangkat: p.waktuBerangkat ? String(p.waktuBerangkat) : undefined,
        waktuPulang: p.waktuPulang ? String(p.waktuPulang) : undefined,
        username: p.username ? String(p.username) : undefined,
        statusPassword: (p.statusPassword as PesertaRihlah['statusPassword']) ?? '-',
      }));

      return { ok: true, data: mapped };
    } catch {
      return { ok: false, data: [], message: PESAN_KONEKSI };
    }
  },

  registerPeserta: async (payload: FormPendaftaran): Promise<RegisterApiResponse> => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await bacaJson(res);
      if (!isObject(json)) return { success: false, status: 'error', message: `Server error (${res.status}).`, error: `Server error (${res.status}).` };

      const isSuccess = res.ok && Boolean(json.success || json.status === 'success');
      const id = isObject(json.data) ? String(json.data.idPeserta ?? '') : (json.id ? String(json.id) : undefined);
      const msg = String(json.message || json.error || (isSuccess ? 'Pendaftaran berhasil disimpan!' : `Pendaftaran gagal (${res.status}).`));

      return {
        success: isSuccess,
        status: isSuccess ? 'success' : 'error',
        id,
        data: id ? { idPeserta: id } : undefined,
        message: msg,
        error: !isSuccess ? msg : undefined,
      };
    } catch {
      return { success: false, status: 'error', message: PESAN_KONEKSI, error: PESAN_KONEKSI };
    }
  },

  loginPanitia: async (username: string, password: string): Promise<{ valid: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/panitia/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await bacaJson(res);
      if (!isObject(json)) return { valid: false, message: `Server error (${res.status}).` };

      return {
        valid: res.ok && json.success === true,
        message: String(json.message || json.error || ''),
      };
    } catch {
      return { valid: false, message: PESAN_KONEKSI };
    }
  },

  logout: async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Login peserta.
   * PENTING: response dikembalikan sebagai ApiResponse<PesertaRihlah>.
   * Mapping backend (namaLengkap) dipetakan secara akurat ke nama dan namaLengkap
   * agar data frontend tidak hilang atau undefined.
   */
  loginPeserta: async (username: string, password: string): Promise<ApiResponse<PesertaRihlah>> => {
    try {
      const res = await fetch('/api/auth/peserta/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await bacaJson(res);
      if (!isObject(json)) {
        const errorMsg = `Server error (${res.status}).`;
        return { success: false, status: 'error', error: errorMsg, message: errorMsg };
      }

      if (!json.success || !isObject(json.data)) {
        const errMsg = String(json.message || json.error || 'Login gagal.');
        return { success: false, status: 'error', error: errMsg, message: errMsg };
      }

      // Map field DB ke shape PesertaRihlah — API mengembalikan namaLengkap, dipetakan ke nama
      const d = json.data;
      const namaPeserta = String(d.namaLengkap ?? d.nama ?? '');
      const peserta: PesertaRihlah = {
        id: String(d.idPeserta ?? ''),
        nama: namaPeserta,
        namaLengkap: namaPeserta,
        jk: (d.jenisKelamin as PesertaRihlah['jk']) ?? 'Laki-laki',
        unit: String(d.asalSekolah ?? d.unit ?? ''),
        partisipasi: (d.partisipasi as PesertaRihlah['partisipasi']) ?? 'Ikut',
        alasan: d.alasanTidakIkut ? String(d.alasanTidakIkut) : undefined,
        waPeserta: d.waPribadi ? String(d.waPribadi) : (d.waPeserta ? String(d.waPeserta) : undefined),
        waDarurat: d.waDarurat ? String(d.waDarurat) : undefined,
        medis: d.riwayatMedis ? String(d.riwayatMedis) : (d.medis ? String(d.medis) : undefined),
        waktuBerangkat: d.waktuBerangkat ? String(d.waktuBerangkat) : undefined,
        waktuPulang: d.waktuPulang ? String(d.waktuPulang) : undefined,
        username: d.username ? String(d.username) : username,
        statusPassword: (d.statusPassword as PesertaRihlah['statusPassword']) ?? '-',
      };

      return { success: true, status: 'success', data: peserta, message: 'Login berhasil' };
    } catch {
      return { success: false, status: 'error', error: PESAN_KONEKSI, message: PESAN_KONEKSI };
    }
  },

  prosesGantiPasswordAwal: async (username: string, oldPass: string, newPass: string): Promise<ApiResponse<null>> => {
    try {
      const res = await fetch('/api/auth/ganti-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, oldPassword: oldPass, newPassword: newPass }),
      });
      const json = await bacaJson(res);
      if (!isObject(json)) {
        const errorMsg = `Server error (${res.status}).`;
        return { success: false, status: 'error', error: errorMsg, message: errorMsg };
      }

      const isSuccess = Boolean(json.success);
      const msg = String(json.message || json.error || (isSuccess ? 'Password berhasil diubah' : 'Gagal mengganti password'));
      return {
        success: isSuccess,
        status: isSuccess ? 'success' : 'error',
        message: msg,
        error: !isSuccess ? msg : undefined,
      };
    } catch {
      return { success: false, status: 'error', error: PESAN_KONEKSI, message: PESAN_KONEKSI };
    }
  },

  resetPasswordLupa: async (identifier: string, noWa: string, newPass: string): Promise<ApiResponse<null>> => {
    try {
      const res = await fetch('/api/auth/ganti-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, noWa, newPassword: newPass }),
      });
      const json = await bacaJson(res);
      if (!isObject(json)) {
        const errorMsg = `Server error (${res.status}).`;
        return { success: false, status: 'error', error: errorMsg, message: errorMsg };
      }

      const isSuccess = Boolean(json.success);
      const msg = String(json.message || json.error || (isSuccess ? 'Password berhasil direset' : 'Gagal mereset password'));
      return {
        success: isSuccess,
        status: isSuccess ? 'success' : 'error',
        message: msg,
        error: !isSuccess ? msg : undefined,
      };
    } catch {
      return { success: false, status: 'error', error: PESAN_KONEKSI, message: PESAN_KONEKSI };
    }
  },

  /**
   * Proses scan QR atau manual ID.
   * PENTING: meneruskan field 'nama' dari response server agar App.tsx bisa
   * menampilkan nama peserta di notifikasi setelah scan berhasil.
   */
  prosesScan: async (idPeserta: string, mode: 'berangkat' | 'pulang'): Promise<ScanApiResponse> => {
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idPeserta,
          keterangan: mode === 'berangkat' ? 'Scan Keberangkatan' : 'Scan Kepulangan',
        }),
      });
      const json = await bacaJson(res);

      if (res.status === 401) {
        const msg = isObject(json) ? String(json.error || '') : '';
        return {
          success: false,
          status: 'error',
          unauthorized: true,
          error: msg || 'Sesi tidak valid.',
          message: msg || 'Sesi tidak valid.',
        };
      }
      if (!isObject(json)) {
        const errorMsg = `Server error (${res.status}).`;
        return { success: false, status: 'error', error: errorMsg, message: errorMsg };
      }

      const isSuccess = res.ok && Boolean(json.success || json.status === 'success');
      const nama = json.nama ? String(json.nama) : undefined;
      const id = json.idPeserta ? String(json.idPeserta) : idPeserta;
      const msg = String(json.message || json.error || (isSuccess ? 'Presensi berhasil dicatat!' : `Presensi gagal (${res.status}).`));

      return {
        success: isSuccess,
        status: isSuccess ? 'success' : 'error',
        nama,
        idPeserta: id,
        data: {
          nama,
          idPeserta: id,
        },
        message: msg,
        error: !isSuccess ? msg : undefined,
      };
    } catch {
      return {
        success: false,
        status: 'error',
        error: PESAN_KONEKSI,
        message: PESAN_KONEKSI,
      };
    }
  },
};

