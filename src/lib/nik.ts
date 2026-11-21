/**
 * Validasi FORMAT NIK dan NPWP. Bukan verifikasi ke Dukcapil/DJP: NIK yang lolos belum tentu terdaftar.
 * Struktur NIK: PP 40/2019 Pasal 31 ayat (1).
 */

export type Wilayah = Record<string, string>; // kode bertitik ("11", "11.01", "11.01.01") → nama

export type Check = { ok: boolean; level: 'error' | 'warning' | 'info'; message: string };

export type NikResult = {
  valid: boolean;
  digits: string;
  segments: { label: string; value: string; meaning: string }[];
  checks: Check[];
};

const pad = (n: number) => String(n).padStart(2, '0');

function realDate(y: number, m: number, d: number) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function validateNik(input: string, wilayah: Wilayah | null, today = new Date()): NikResult {
  const digits = input.replace(/[\s.-]/g, '');
  const checks: Check[] = [];
  const segments: NikResult['segments'] = [];

  if (!/^\d{16}$/.test(digits)) {
    checks.push({ ok: false, level: 'error', message: `NIK harus 16 digit angka, ditemukan ${digits.length} karakter.` });
    return { valid: false, digits, segments, checks };
  }

  const prov = digits.slice(0, 2);
  const kab = digits.slice(2, 4);
  const kec = digits.slice(4, 6);
  const dd = Number(digits.slice(6, 8));
  const mm = Number(digits.slice(8, 10));
  const yy = Number(digits.slice(10, 12));
  const serial = digits.slice(12, 16);

  // Wilayah: kode saat NIK diterbitkan. Pemekaran bisa membuat kode lama tidak ada di data terbaru.
  const kProv = prov;
  const kKab = `${prov}.${kab}`;
  const kKec = `${prov}.${kab}.${kec}`;
  if (wilayah) {
    const nProv = wilayah[kProv];
    const nKab = wilayah[kKab];
    const nKec = wilayah[kKec];
    segments.push({ label: 'Provinsi', value: prov, meaning: nProv ?? 'Tidak ada di data wilayah 2025' });
    segments.push({ label: 'Kabupaten/kota', value: kab, meaning: nKab ?? 'Tidak ada di data wilayah 2025' });
    segments.push({ label: 'Kecamatan', value: kec, meaning: nKec ?? 'Tidak ada di data wilayah 2025' });
    if (!nProv) checks.push({ ok: false, level: 'error', message: `Kode provinsi ${prov} tidak dikenal.` });
    else if (!nKec)
      checks.push({
        ok: false,
        level: 'warning',
        message: `Kode kecamatan ${kKec} tidak ada di data Kepmendagri 2025. Bisa salah ketik, atau kode lama sebelum pemekaran wilayah.`,
      });
    else checks.push({ ok: true, level: 'info', message: `Wilayah ditemukan: ${nKec}, ${nKab}, ${nProv}.` });
  } else {
    segments.push({ label: 'Kode wilayah', value: digits.slice(0, 6), meaning: 'Data wilayah belum dimuat' });
  }

  const female = dd > 40;
  const day = female ? dd - 40 : dd;
  // Tahun 2 digit: abad ditebak. Kandidat yang jatuh di masa depan dibuang.
  const yearNow = today.getUTCFullYear();
  const candidates = [1900 + yy, 2000 + yy].filter((y) => y <= yearNow && realDate(y, mm, day));
  const birthOk = day >= 1 && mm >= 1 && mm <= 12 && candidates.length > 0;
  const year = candidates[candidates.length - 1];

  segments.push({
    label: 'Tanggal lahir',
    value: digits.slice(6, 12),
    meaning: birthOk ? `${pad(day)}-${pad(mm)}-${year}${candidates.length > 1 ? ` (atau ${candidates[0]})` : ''}` : 'Tidak valid',
  });
  segments.push({ label: 'Jenis kelamin', value: digits.slice(6, 8), meaning: female ? 'Perempuan (tanggal + 40)' : 'Laki-laki' });
  segments.push({ label: 'Nomor urut', value: serial, meaning: 'Nomor urut dari SIAK' });

  if (dd === 0 || (dd > 31 && dd < 41) || dd > 71) {
    checks.push({ ok: false, level: 'error', message: `Digit tanggal ${pad(dd)} tidak mungkin. Laki-laki 01-31, perempuan 41-71.` });
  } else if (!birthOk) {
    checks.push({ ok: false, level: 'error', message: `Tanggal lahir ${pad(day)}-${pad(mm)}-${pad(yy)} tidak ada di kalender.` });
  } else {
    checks.push({ ok: true, level: 'info', message: 'Tanggal lahir valid.' });
  }
  if (serial === '0000') checks.push({ ok: false, level: 'warning', message: 'Nomor urut 0000 tidak lazim (biasanya mulai 0001).' });

  const valid = !checks.some((c) => c.level === 'error');
  return { valid, digits, segments, checks };
}

export type NpwpResult = { valid: boolean; digits: string; formatted: string; type: string; checks: Check[] };

/**
 * NPWP 16 digit (PMK 112/2022, berlaku penuh 1 Juli 2024): orang pribadi = NIK, badan = "0" + NPWP 15 digit.
 * NPWP 15 digit: 9 digit kode wajib pajak, 3 digit kode KPP, 3 digit status (000 = pusat).
 */
export function validateNpwp(input: string): NpwpResult {
  const digits = input.replace(/[\s.-]/g, '');
  const checks: Check[] = [];
  if (/^\d{15}$/.test(digits)) {
    const formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}.${digits.slice(8, 9)}-${digits.slice(9, 12)}.${digits.slice(12)}`;
    checks.push({ ok: true, level: 'info', message: `Kode KPP ${digits.slice(9, 12)}, status ${digits.slice(12) === '000' ? '000 (pusat)' : `${digits.slice(12)} (cabang)`}.` });
    checks.push({ ok: true, level: 'warning', message: `Format lama. Sejak 1 Juli 2024 dipakai NPWP 16 digit: 0${digits}.` });
    return { valid: true, digits, formatted, type: 'NPWP 15 digit (format lama)', checks };
  }
  if (/^\d{16}$/.test(digits)) {
    const badan = digits.startsWith('0');
    checks.push({
      ok: true,
      level: 'info',
      message: badan ? 'Diawali 0: NPWP badan/instansi (0 + NPWP 15 digit lama).' : 'Untuk orang pribadi penduduk, NPWP 16 digit sama dengan NIK.',
    });
    return { valid: true, digits, formatted: digits, type: badan ? 'NPWP 16 digit (badan)' : 'NPWP 16 digit (NIK)', checks };
  }
  // NITKU (PER-6/PJ/2024, contoh di lampiran): NPWP 16 digit pusat + 6 digit urut. Pusat 000000, cabang 000001 dst.
  if (/^\d{22}$/.test(digits)) {
    const npwp = digits.slice(0, 16);
    const tku = digits.slice(16);
    const pusat = tku === '000000';
    checks.push({ ok: true, level: 'info', message: `NPWP 16 digit: ${npwp} (${npwp.startsWith('0') ? 'badan/instansi' : 'NIK orang pribadi'}).` });
    checks.push({ ok: true, level: 'info', message: pusat ? 'Akhiran 000000: tempat kegiatan usaha pusat.' : `Akhiran ${tku}: tempat kegiatan usaha ke-${Number(tku)} (cabang).` });
    return { valid: true, digits, formatted: `${npwp} ${tku}`, type: `NITKU 22 digit (${pusat ? 'pusat' : 'cabang'})`, checks };
  }
  checks.push({ ok: false, level: 'error', message: `NPWP harus 15 atau 16 digit angka (NITKU 22 digit), ditemukan ${digits.length}.` });
  return { valid: false, digits, formatted: '', type: '-', checks };
}
