// Ubah data/wilayah.csv jadi JSON statis di public/.
// Sumber: repo data-wilayah (diturunkan dari lampiran Kepmendagri 300.2.2-2138/2025 jo. 300.2.2-2430/2025),
// disalin ke sini dengan `make sync` di repo itu. Jalan otomatis sebelum dev/build. Output di-gitignore.
import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'data/wilayah.csv';
const API = 'public/api/wilayah';
const LAST = 'public/data/wilayah-nik.json'; // ditulis paling akhir = penanda output lengkap

// Hapus-tulis ulang ribuan file saat `astro dev` jalan bikin dev server kehilangan file (404). Lewati kalau output sudah baru.
const mtime = (f) => statSync(f, { throwIfNoEntry: false })?.mtimeMs ?? 0;
if (mtime(LAST) > Math.max(mtime(SRC), mtime('data/meta.json'), mtime(import.meta.filename))) {
  console.log('wilayah: output sudah terbaru, dilewati');
  process.exit(0);
}

// CSV dari Python csv module: field berisi koma/kutip dibungkus "..." dengan "" untuk kutip. Tanpa baris baru di nama.
const parseLine = (line) => {
  const m = line.match(/^([0-9.]+),(?:"((?:[^"]|"")*)"|([^",]*))$/);
  if (!m) throw new Error(`Baris CSV tidak dikenali: ${line}`);
  return { kode: m[1], nama: m[2] !== undefined ? m[2].replace(/""/g, '"') : m[3] };
};
const [header, ...lines] = readFileSync(SRC, 'utf8').trimEnd().split('\n');
if (header !== 'kode,nama') throw new Error(`Header ${SRC} harus "kode,nama", dapat "${header}".`);
const rows = lines.map(parseLine);

const level = (k) => k.split('.').length;
const byLevel = [1, 2, 3, 4].map((l) => rows.filter((r) => level(r.kode) === l));
const [prov, kab, kec, desa] = byLevel;

// Jumlah resmi per level (sudah dicek sama dengan rekap Kepmendagri di repo data-wilayah).
const { expected } = JSON.parse(readFileSync('data/meta.json', 'utf8'));
byLevel.forEach((list, i) => {
  if (list.length !== expected[i]) throw new Error(`Level ${i + 1}: ${list.length} baris, seharusnya ${expected[i]}. Cek ${SRC}.`);
});
if (new Set(rows.map((r) => r.kode)).size !== rows.length) throw new Error('Ada kode wilayah ganda.');

rmSync(API, { recursive: true, force: true });
const write = (path, data) => {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
};
const parent = (k) => k.slice(0, k.lastIndexOf('.'));
const group = (list) => {
  const g = new Map();
  for (const r of list) {
    const p = parent(r.kode);
    if (!g.has(p)) g.set(p, []);
    g.get(p).push(r);
  }
  return g;
};

write(join(API, 'provinsi.json'), prov);
for (const [lvl, list] of [['kabupaten', kab], ['kecamatan', kec], ['desa', desa]]) {
  for (const [p, items] of group(list)) write(join(API, lvl, `${p}.json`), items);
}

// Peta ringkas untuk validator NIK (provinsi + kab/kota + kecamatan).
write(LAST, Object.fromEntries([...prov, ...kab, ...kec].map((r) => [r.kode, r.nama])));

console.log(`wilayah: ${prov.length} prov, ${kab.length} kab/kota, ${kec.length} kec, ${desa.length} desa`);
