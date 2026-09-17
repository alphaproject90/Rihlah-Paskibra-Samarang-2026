/**
 * ManajemenAdminView.tsx — Tab manajemen akun panitia (Tahap 2C)
 * Hanya dirender jika panitiaRole === 'SUPER_ADMIN'.
 * Fitur: tabel daftar akun + form buat akun baru.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { UserCog, Plus, RefreshCw, ShieldCheck, Car, Eye, EyeOff, Users } from 'lucide-react';
import { apiService } from '../../services/apiService';

interface AkunPanitia {
  id: string;
  username: string;
  namaLengkap: string;
  role: 'SUPER_ADMIN' | 'ADMIN_MOBIL';
  mobil: string | null;
  aktif: boolean;
  createdBy: string | null;
  createdAt: string;
}

interface ManajemenAdminViewProps {
  tampilkanNotif?: (pesan: string, tipe?: 'info' | 'success' | 'error') => void;
}

const INITIAL_FORM = {
  namaLengkap: '',
  username: '',
  password: '',
  role: 'ADMIN_MOBIL' as 'SUPER_ADMIN' | 'ADMIN_MOBIL',
  mobil: '',
};

export const ManajemenAdminView: React.FC<ManajemenAdminViewProps> = ({ tampilkanNotif }) => {
  const [daftarAkun, setDaftarAkun] = useState<AkunPanitia[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const muatDaftarAkun = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await apiService.getAkunPanitia();
      if (res.ok) {
        setDaftarAkun(res.data as unknown as AkunPanitia[]);
      } else {
        tampilkanNotif?.(res.message || 'Gagal memuat daftar akun.', 'error');
      }
    } finally {
      setLoadingList(false);
    }
  }, [tampilkanNotif]);

  useEffect(() => {
    muatDaftarAkun();
  }, [muatDaftarAkun]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.role === 'ADMIN_MOBIL' && !form.mobil.trim()) {
      tampilkanNotif?.('Nama mobil wajib diisi untuk Admin Mobil.', 'error');
      return;
    }
    setLoadingSubmit(true);
    try {
      const res = await apiService.buatAkunPanitia({
        namaLengkap: form.namaLengkap.trim(),
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        mobil: form.role === 'ADMIN_MOBIL' ? form.mobil.trim() : null,
      });
      if (res.ok) {
        tampilkanNotif?.(`Akun "${form.username}" berhasil dibuat!`, 'success');
        setForm(INITIAL_FORM);
        setShowForm(false);
        await muatDaftarAkun();
      } else {
        tampilkanNotif?.(res.message || 'Gagal membuat akun.', 'error');
      }
    } finally {
      setLoadingSubmit(false);
    }
  };

  const superAdmins = daftarAkun.filter((a) => a.role === 'SUPER_ADMIN');
  const adminMobils = daftarAkun.filter((a) => a.role === 'ADMIN_MOBIL');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-red-600" />
            Manajemen Akun Panitia
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun panitia — hanya Super Admin yang dapat melihat halaman ini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-refresh-akun-panitia"
            onClick={muatDaftarAkun}
            disabled={loadingList}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
            Perbarui
          </button>
          <button
            type="button"
            id="btn-tambah-akun-panitia"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Buat Akun
          </button>
        </div>
      </div>

      {/* Form Buat Akun Baru */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-red-600" />
            Form Buat Akun Panitia Baru
          </h3>
          <form id="form-buat-akun-panitia" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-namalengkap-admin"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.namaLengkap}
                  onChange={(e) => setForm((f) => ({ ...f, namaLengkap: e.target.value }))}
                  placeholder="Nama lengkap panitia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-username-admin"
                  type="text"
                  required
                  pattern="[a-zA-Z0-9_]{4,20}"
                  title="4-20 karakter alfanumerik atau underscore"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="contoh: admin_mobil1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-password-admin"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 karakter (huruf besar, kecil, angka, simbol)"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="select-role-admin"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value as typeof form.role, mobil: '' }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none transition bg-white"
                >
                  <option value="ADMIN_MOBIL">Admin Mobil</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>

            {/* Field Mobil — hanya tampil jika ADMIN_MOBIL */}
            {form.role === 'ADMIN_MOBIL' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Mobil <span className="text-red-500">*</span>
                  <span className="ml-1 text-slate-500 font-normal">(contoh: Mobil 1, Kijang AB 1234)</span>
                </label>
                <input
                  id="input-mobil-admin"
                  type="text"
                  required={form.role === 'ADMIN_MOBIL'}
                  maxLength={50}
                  value={form.mobil}
                  onChange={(e) => setForm((f) => ({ ...f, mobil: e.target.value }))}
                  placeholder="Nama rombongan mobil"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none transition"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(INITIAL_FORM); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-submit-buat-akun"
                type="submit"
                disabled={loadingSubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition cursor-pointer shadow-sm flex items-center gap-2"
              >
                {loadingSubmit ? (
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {loadingSubmit ? 'Membuat...' : 'Buat Akun'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel Super Admin */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-600" />
          <span className="text-sm font-bold text-slate-900">Super Admin</span>
          <span className="ml-auto text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
            {superAdmins.length} akun
          </span>
        </div>
        {loadingList ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data...</div>
        ) : superAdmins.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Tidak ada akun Super Admin.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold">
                  <th className="px-4 py-2.5 text-left">Nama</th>
                  <th className="px-4 py-2.5 text-left">Username</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Dibuat oleh</th>
                  <th className="px-4 py-2.5 text-left">Tanggal Dibuat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {superAdmins.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">{a.namaLengkap}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{a.username}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {a.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{a.createdBy ?? '— (migrasi)'}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(a.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabel Admin Mobil */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <Car className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-900">Admin Mobil</span>
          <span className="ml-auto text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
            {adminMobils.length} akun
          </span>
        </div>
        {loadingList ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data...</div>
        ) : adminMobils.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Belum ada Admin Mobil. Klik "Buat Akun" untuk menambahkan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold">
                  <th className="px-4 py-2.5 text-left">Nama</th>
                  <th className="px-4 py-2.5 text-left">Username</th>
                  <th className="px-4 py-2.5 text-left">Mobil</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Dibuat oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminMobils.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800">{a.namaLengkap}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{a.username}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                        <Car className="w-2.5 h-2.5" />
                        {a.mobil ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {a.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{a.createdBy ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
