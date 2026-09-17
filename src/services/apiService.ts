import {
  FormPendaftaran,
  PesertaRihlah,
  StatsRihlah,
  StatistikData,
  DokumenRihlah,
  SystemLogEntry,
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

export interface RequestOtpResponseData {
  maskedPhone: string;
  requestId: string;
}

export interface PanitiaPendingResetItem {
  id: string;
  idPeserta: string;
  nama: string;
  unit: string;
  noWaTersensor: string;
  status: 'PENDING' | 'SENT' | 'USED' | 'EXPIRED' | 'CANCELLED';
  attempts: number;
  createdAt: string;
  sentAt?: string | null;
  sentBy?: string | null;
  expiresAt: string;
}

export interface PanitiaWaLinkResponseData {
  waLink: string;
  expiresAt: string;
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

  /**
   * Langkah 1: Peserta mengajukan permintaan reset password & generate OTP
   */
  requestOtpReset: async (
    identifier: string,
    noWa: string,
    unit?: string
  ): Promise<ApiResponse<RequestOtpResponseData>> => {
    try {
      const res = await fetch('/api/auth/ganti-password?action=request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, noWa, unit }),
      });
      const json = await bacaJson(res);
      if (!isObject(json)) {
        const errorMsg = `Server error (${res.status}).`;
        return { success: false, status: 'error', error: errorMsg, message: errorMsg };
      }

      const isSuccess = Boolean(json.success);
      const msg = String(json.message || json.error || (isSuccess ? 'OTP berhasil diminta' : 'Gagal meminta OTP'));
      return {
        success: isSuccess,
        status: isSuccess ? 'success' : 'error',
        message: msg,
        error: !isSuccess ? msg : undefined,
        data: isSuccess ? {
          maskedPhone: String(json.maskedPhone || ''),
          requestId: String(json.requestId || ''),
        } : undefined,
      };
    } catch {
      return { success: false, status: 'error', error: PESAN_KONEKSI, message: PESAN_KONEKSI };
    }
  },

  /**
   * Langkah 6: Peserta memverifikasi OTP dan menyimpan password baru
   */
  verifyOtpReset: async (
    requestId: string,
    otp: string,
    newPass: string
  ): Promise<ApiResponse<null>> => {
    try {
      const res = await fetch('/api/auth/ganti-password?action=verify-otp-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, otp, newPassword: newPass }),
      });
      const json = await bacaJson(res);
      if (!isObject(json)) {
        const errorMsg = `Server error (${res.status}).`;
        return { success: false, status: 'error', error: errorMsg, message: errorMsg };
      }

      const isSuccess = Boolean(json.success);
      const msg = String(json.message || json.error || (isSuccess ? 'Password berhasil diperbarui' : 'Gagal memperbarui password'));
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
   * Langkah 4a: Panitia mengambil daftar antrean permohonan reset password peserta
   */
  getPanitiaPendingResets: async (): Promise<ApiResponse<PanitiaPendingResetItem[]>> => {
    try {
      const res = await fetch('/api/auth/ganti-password?action=panitia-pending-resets');
      const json = await bacaJson(res);
      if (!isObject(json)) {
        const errorMsg = `Server error (${res.status}).`;
        return { success: false, status: 'error', error: errorMsg, message: errorMsg, data: [] };
      }

      const isSuccess = Boolean(json.success);
      const rawData = Array.isArray(json.data) ? json.data : [];
      const mappedData: PanitiaPendingResetItem[] = rawData.map((item: any) => ({
        id: String(item.id || ''),
        idPeserta: String(item.idPeserta || ''),
        nama: String(item.nama || ''),
        unit: String(item.unit || '-'),
        noWaTersensor: String(item.noWaTersensor || ''),
        status: item.status || 'PENDING',
        attempts: Number(item.attempts || 0),
        createdAt: String(item.createdAt || ''),
        sentAt: item.sentAt ? String(item.sentAt) : null,
        sentBy: item.sentBy ? String(item.sentBy) : null,
        expiresAt: String(item.expiresAt || ''),
      }));

      return {
        success: isSuccess,
        status: isSuccess ? 'success' : 'error',
        message: String(json.message || ''),
        error: !isSuccess ? String(json.error || 'Gagal memuat antrean reset') : undefined,
        data: mappedData,
      };
    } catch {
      return { success: false, status: 'error', error: PESAN_KONEKSI, message: PESAN_KONEKSI, data: [] };
    }
  },

  /**
   * Langkah 4b: Panitia men-generate tautan WhatsApp wa.me untuk mengirimkan OTP
   */
  generatePanitiaWaLink: async (
    requestId: string
  ): Promise<ApiResponse<PanitiaWaLinkResponseData>> => {
    try {
      const res = await fetch('/api/auth/ganti-password?action=panitia-get-wa-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const json = await bacaJson(res);
      if (!isObject(json)) {
        const errorMsg = `Server error (${res.status}).`;
        return { success: false, status: 'error', error: errorMsg, message: errorMsg };
      }

      const isSuccess = Boolean(json.success);
      const msg = String(json.message || json.error || (isSuccess ? 'Link WhatsApp berhasil dibuat' : 'Gagal membuat link WhatsApp'));
      return {
        success: isSuccess,
        status: isSuccess ? 'success' : 'error',
        message: msg,
        error: !isSuccess ? msg : undefined,
        data: isSuccess ? {
          waLink: String(json.waLink || ''),
          expiresAt: String(json.expiresAt || ''),
        } : undefined,
      };
    } catch {
      return { success: false, status: 'error', error: PESAN_KONEKSI, message: PESAN_KONEKSI };
    }
  },

  /**
   * Revisi #2: Panitia membatalkan antrean permohonan reset peserta
   */
  cancelPanitiaReset: async (
    requestId: string
  ): Promise<ApiResponse<null>> => {
    try {
      const res = await fetch('/api/auth/ganti-password?action=panitia-cancel-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const json = await bacaJson(res);
      if (!isObject(json)) {
        const errorMsg = `Server error (${res.status}).`;
        return { success: false, status: 'error', error: errorMsg, message: errorMsg };
      }

      const isSuccess = Boolean(json.success);
      const msg = String(json.message || json.error || (isSuccess ? 'Permohonan berhasil dibatalkan' : 'Gagal membatalkan permohonan'));
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

  getDokumen: async (): Promise<{ ok: boolean; data: DokumenRihlah[]; message?: string; unauthorized?: boolean }> => {
    try {
      const res = await fetch('/api/dokumen');
      const json = await bacaJson(res);
      if (res.status === 401) {
        return { ok: false, data: [], unauthorized: true, message: 'Sesi berakhir atau tidak valid.' };
      }
      if (!res.ok || !isObject(json) || !json.success || !Array.isArray(json.data)) {
        const errorMsg = isObject(json) && (json.error || json.message)
          ? String(json.error || json.message)
          : `Gagal memuat dokumen (${res.status})`;
        return { ok: false, data: [], message: errorMsg };
      }
      return { ok: true, data: json.data as DokumenRihlah[] };
    } catch {
      return { ok: false, data: [], message: PESAN_KONEKSI };
    }
  },

  deleteDokumen: async (id: string): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch(`/api/dokumen?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await bacaJson(res);
      if (!res.ok || !isObject(json) || !json.success) {
        const errorMsg = isObject(json) && (json.error || json.message)
          ? String(json.error || json.message)
          : `Gagal menghapus dokumen (${res.status})`;
        return { ok: false, message: errorMsg };
      }
      return { ok: true, message: String(json.message || 'Dokumen berhasil dihapus') };
    } catch {
      return { ok: false, message: PESAN_KONEKSI };
    }
  },

  getSystemLog: async (params?: {
    level?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ ok: boolean; data: SystemLogEntry[]; nextCursor: string | null; message?: string; unauthorized?: boolean }> => {
    try {
      const query = new URLSearchParams();
      if (params?.level && params.level !== 'Semua') query.set('level', params.level);
      if (params?.cursor) query.set('cursor', params.cursor);
      if (params?.limit) query.set('limit', String(params.limit));

      const qs = query.toString();
      const res = await fetch(`/api/systemlog${qs ? `?${qs}` : ''}`);
      const json = await bacaJson(res);

      if (res.status === 401) {
        return { ok: false, data: [], nextCursor: null, unauthorized: true, message: 'Sesi berakhir atau tidak valid.' };
      }
      if (!res.ok || !isObject(json) || !json.success || !Array.isArray(json.data)) {
        const errorMsg = isObject(json) && (json.error || json.message)
          ? String(json.error || json.message)
          : `Gagal memuat log sistem (${res.status})`;
        return { ok: false, data: [], nextCursor: null, message: errorMsg };
      }
      return {
        ok: true,
        data: json.data as SystemLogEntry[],
        nextCursor: typeof json.nextCursor === 'string' ? json.nextCursor : null,
      };
    } catch {
      return { ok: false, data: [], nextCursor: null, message: PESAN_KONEKSI };
    }
  },

  updatePengaturan: async (pendaftaranDibuka: boolean): Promise<{ ok: boolean; message?: string; unauthorized?: boolean }> => {
    try {
      const res = await fetch('/api/statistik', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendaftaranDibuka }),
      });
      const json = await bacaJson(res);

      if (res.status === 401) {
        return { ok: false, unauthorized: true, message: 'Sesi panitia berakhir. Silakan login ulang.' };
      }
      if (!res.ok || !isObject(json) || !json.success) {
        const errorMsg = isObject(json) && (json.error || json.message)
          ? String(json.error || json.message)
          : `Gagal memperbarui pengaturan (${res.status})`;
        return { ok: false, message: errorMsg };
      }
      return { ok: true, message: String(json.message || 'Pengaturan berhasil diperbarui.') };
    } catch {
      return { ok: false, message: PESAN_KONEKSI };
    }
  },

  gantiPasswordPanitia: async (
    oldPassword: string,
    newPassword: string,
    confirmPassword?: string
  ): Promise<{ ok: boolean; message?: string; unauthorized?: boolean }> => {
    try {
      const res = await fetch('/api/auth/ganti-password?target=panitia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmPassword: confirmPassword || newPassword,
          target: 'panitia',
        }),
      });
      const json = await bacaJson(res);

      if (res.status === 401) {
        return { ok: false, unauthorized: true, message: 'Sesi panitia berakhir atau tidak sah. Silakan login ulang.' };
      }
      if (!res.ok || !isObject(json) || !json.success) {
        const errorMsg = isObject(json) && (json.error || json.message)
          ? String(json.error || json.message)
          : `Gagal mengubah password panitia (${res.status})`;
        return { ok: false, message: errorMsg };
      }
      return { ok: true, message: String(json.message || 'Password panitia berhasil diperbarui.') };
    } catch {
      return { ok: false, message: PESAN_KONEKSI };
    }
  },
};


