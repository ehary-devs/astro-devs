/** Data jadwal sholat saat build (node:fs). Jangan di-import dari <script> browser. */
import { readFileSync } from 'node:fs';
import { slugOf, type JadwalFile } from './jadwal';
import meta from '../../public/api/jadwal-sholat/meta.json';

export { meta };
export type Kab = { kode: string; nama: string; slug: string; prov: string; provNama: string };

// CSV dari data-wilayah: nama berisi koma dibungkus "...". Hanya provinsi + kab/kota yang dipakai.
const rows = readFileSync('data/wilayah.csv', 'utf8')
  .trimEnd()
  .split('\n')
  .slice(1)
  .map((l) => l.match(/^(\d{2}(?:\.\d{2})?),(?:"((?:[^"]|"")*)"|([^",]*))$/))
  .filter((m): m is RegExpMatchArray => !!m)
  .map((m) => ({ kode: m[1], nama: m[2] !== undefined ? m[2].replace(/""/g, '"') : m[3] }));

const provNama = new Map(rows.filter((r) => r.kode.length === 2).map((r) => [r.kode, r.nama]));

export const KAB: Kab[] = rows
  .filter((r) => r.kode.length === 5)
  .map((r) => ({ ...r, slug: slugOf(r.nama), prov: r.kode.slice(0, 2), provNama: provNama.get(r.kode.slice(0, 2))! }));

if (KAB.length !== meta.kabkota || new Set(KAB.map((k) => k.slug)).size !== KAB.length) {
  throw new Error(`jadwal-sholat: ${KAB.length} kab/kota di wilayah.csv, meta ${meta.kabkota}, atau ada slug ganda.`);
}

export const PROV = [...provNama].map(([kode, nama]) => ({ kode, nama, kab: KAB.filter((k) => k.prov === kode) }));

export const readJadwal = (tahun: number, kode: string): JadwalFile =>
  JSON.parse(readFileSync(`public/api/jadwal-sholat/${tahun}/${kode}.json`, 'utf8'));
