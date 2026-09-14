import { Peserta, RundownItem, ReguInfo, TransaksiKeuangan, LogistikItem, ConfigIntegrasi, PresensiLog } from '../types';
import { INITIAL_PESERTA, INITIAL_RUNDOWN, INITIAL_REGU, INITIAL_KEUANGAN, INITIAL_LOGISTIK, INITIAL_CONFIG } from '../data/initialData';

const KEYS = {
  PESERTA: 'paskibar_samarang_peserta_v1',
  RUNDOWN: 'paskibar_samarang_rundown_v1',
  REGU: 'paskibar_samarang_regu_v1',
  KEUANGAN: 'paskibar_samarang_keuangan_v1',
  LOGISTIK: 'paskibar_samarang_logistik_v1',
  CONFIG: 'paskibar_samarang_config_v1',
  PRESENSI_LOGS: 'paskibar_samarang_presensi_logs_v1'
};

export function loadData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
    return defaultValue;
  }
}

export function saveData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
}

export function exportToCsv(filename: string, rows: object[]): void {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = (row as any)[k] === null || (row as any)[k] === undefined ? '' : (row as any)[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export { KEYS };
