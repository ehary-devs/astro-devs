/**
 * Baca NRKB (nomor pelat). Struktur: Perpol 7/2021 Pasal 6 = kode wilayah + nomor urut (1-4 angka) + seri huruf.
 * Kode wilayah dan alokasi nomor: Lampiran A dan C. Ini membaca format, bukan cek data registrasi Korlantas.
 */
import { PLAT, type KodePlat } from '../data/plat.ts';

/** Lampiran B: kode registrasi berdasarkan kepentingan pengguna. */
export const KODE_KHUSUS: Record<string, string> = {
  CD: 'Korps Diplomatik',
  CC: 'Korps Konsulat',
  CH: 'Konsul Kehormatan',
  RI: 'Dinas Presiden, Wakil Presiden, Ketua Lembaga Tinggi Negara, dan pejabat setingkat menteri',
};

/** Lampiran C angka 1 (umum) dan angka 2 (wilayah hukum Polda Metro Jaya = kode B). [batas atas, jenis]. */
const ALOKASI: [number, string][] = [[1999, 'Mobil penumpang'], [6999, 'Sepeda motor'], [7999, 'Mobil bus'], [8999, 'Mobil barang'], [9999, 'Kendaraan khusus']];
const ALOKASI_B: [number, string][] = [[2999, 'Mobil penumpang'], [6999, 'Sepeda motor'], [7999, 'Mobil bus'], [8999, 'Mobil penumpang'], [9999, 'Mobil barang dan kendaraan khusus']];

export const jenisDariNomor = (kode: string, n: number) => (kode === 'B' ? ALOKASI_B : ALOKASI).find(([max]) => n <= max)?.[1] ?? null;

export type PlatResult = {
  valid: boolean;
  plat: string;
  kode?: string;
  nomor?: string;
  seri?: string;
  wilayah?: KodePlat;
  khusus?: string;
  jenis?: string | null;
  checks: { level: 'error' | 'warning' | 'info'; message: string }[];
};

export function parsePlat(input: string): PlatResult {
  const s = input.toUpperCase().replace(/[\s.-]/g, '');
  const checks: PlatResult['checks'] = [];
  const m = s.match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{0,3})$/);
  if (!m) {
    checks.push({ level: 'error', message: 'Format pelat: 1-2 huruf kode wilayah, 1-4 angka, lalu 0-3 huruf seri. Contoh: B 1234 ABC.' });
    return { valid: false, plat: s, checks };
  }
  const [, kode, nomor, seri] = m;
  const plat = [kode, nomor, seri].filter(Boolean).join(' ');
  const wilayah = PLAT.find((p) => p.kode === kode);
  const khusus = KODE_KHUSUS[kode];
  if (!wilayah && !khusus) checks.push({ level: 'error', message: `Kode ${kode} tidak ada di Lampiran A maupun B Perpol 7/2021.` });
  if (/^0/.test(nomor)) checks.push({ level: 'error', message: 'Nomor urut registrasi tidak diawali angka 0.' });
  let jenis: string | null = null;
  if (wilayah && !/^0/.test(nomor)) {
    jenis = jenisDariNomor(kode, Number(nomor));
    checks.push({ level: 'info', message: `Kode ${kode}: ${wilayah.daerah}, ${wilayah.lingkup.length} kabupaten/kota.` });
  }
  if (khusus) checks.push({ level: 'info', message: `Kode registrasi khusus: ${khusus}.` });
  return { valid: !checks.some((c) => c.level === 'error'), plat, kode, nomor, seri, wilayah, khusus, jenis, checks };
}
