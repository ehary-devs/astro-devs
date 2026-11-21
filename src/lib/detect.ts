/** Tebak jenis input di kotak beranda. Urutan penting: QRIS > NIK/NPWP > HP > angka. */
export type Kind = 'qris' | 'nik' | 'npwp' | 'phone' | 'number' | 'plat' | 'empty' | 'unknown';

export function detect(raw: string): Kind {
  const s = raw.trim();
  if (!s) return 'empty';
  if (s.startsWith('000201') && s.length > 30) return 'qris';
  const digits = s.replace(/[\s.-]/g, '');
  // NPWP 15 digit lama sering ditulis 00.000.000.0-000.000
  if (/^\d{15}$/.test(digits)) return 'npwp';
  if (/^\d{16}$/.test(digits) && !digits.startsWith('0')) return 'nik';
  if (/^\d{16}$/.test(digits) || /^\d{22}$/.test(digits)) return 'npwp'; // 22 digit = NITKU
  if (/^(\+?62|0)8[\d\s-]{7,14}$/.test(s)) return 'phone';
  if (/^-?(rp\s?)?[\d.,]+$/i.test(s) && /\d/.test(s)) return 'number';
  if (/^[a-z]{1,2}\s?\d{1,4}(\s?[a-z]{1,3})?$/i.test(s)) return 'plat'; // setelah 'number' supaya "Rp 100" tetap angka
  return 'unknown';
}
