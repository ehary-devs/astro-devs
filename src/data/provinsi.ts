// Hanya dipakai saat build (node:fs). Sumber sama dengan scripts/build-wilayah.mjs.
import { readFileSync } from 'node:fs';

/** 38 provinsi dari data/wilayah.csv. Nama provinsi tidak mengandung koma atau kutip. */
export const PROVINSI = readFileSync('data/wilayah.csv', 'utf8')
  .split('\n')
  .filter((l) => /^\d\d,/.test(l))
  .map((l) => ({ kode: l.slice(0, 2), nama: l.slice(3).trim() }));
