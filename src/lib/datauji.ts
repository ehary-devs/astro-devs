/**
 * Data uji fiktif dengan format valid: NIK (kode kecamatan nyata, tanggal lahir nyata), NPWP 16 digit,
 * NITKU pusat, nomor HP dengan prefix operator nyata. Angkanya acak, jadi bisa kebetulan sama dengan milik orang.
 */
import type { Wilayah } from './nik.ts';
import { PREFIX } from './operator.ts';
import { zonaOf } from './zona.ts';

export type Rand = () => number;

/** PRNG kecil ber-seed (mulberry32): seed sama → data sama, berguna untuk fixture tes. */
export function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (r: Rand, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const pick = <T>(r: Rand, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
const digits = (r: Rand, n: number) => Array.from({ length: n }, () => int(r, 0, 9)).join('');
const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export type Orang = {
  nik: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string; // YYYY-MM-DD
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kode_kecamatan: string;
  zona_waktu: string;
  npwp: string; // orang pribadi penduduk: NPWP 16 digit = NIK
  nitku: string; // NPWP 16 digit + 000000 (pusat)
  hp: string;
  operator: string;
};

/** Kode kecamatan (level 3) dari peta wilayah-nik.json. */
export const kecamatanOf = (w: Wilayah) => Object.keys(w).filter((k) => k.split('.').length === 3);

/** Usia 17-70 tahun per `today`. */
export function fakeOrang(r: Rand, w: Wilayah, kecs: string[], today = new Date()): Orang {
  const kec = pick(r, kecs);
  const yNow = today.getUTCFullYear();
  const y = int(r, yNow - 70, yNow - 17);
  const m = int(r, 1, 12);
  const d = int(r, 1, new Date(Date.UTC(y, m, 0)).getUTCDate());
  const p = r() < 0.5;
  const nik = kec.replace(/\./g, '') + pad(p ? d + 40 : d) + pad(m) + pad(y % 100) + pad(int(r, 1, 9999), 4);
  const [list, brand] = pick(r, PREFIX);
  // 0 + prefix 3 digit + 7-8 digit = 11-12 digit, di dalam rentang nomor seluler Indonesia.
  const hp = pick(r, list) + digits(r, int(r, 7, 8));
  return {
    nik,
    jenis_kelamin: p ? 'P' : 'L',
    tanggal_lahir: `${y}-${pad(m)}-${pad(d)}`,
    kecamatan: w[kec],
    kabupaten: w[kec.slice(0, 5)],
    provinsi: w[kec.slice(0, 2)],
    kode_kecamatan: kec,
    zona_waktu: zonaOf(kec)?.zona ?? '',
    npwp: nik,
    nitku: nik + '000000',
    hp,
    operator: brand,
  };
}

/** CSV RFC 4180: field dikutip kalau berisi koma, kutip, atau baris baru. */
export function toCsv(rows: Record<string, string>[]) {
  if (!rows.length) return '';
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const keys = Object.keys(rows[0]);
  return [keys.join(','), ...rows.map((row) => keys.map((k) => esc(row[k])).join(','))].join('\n');
}
