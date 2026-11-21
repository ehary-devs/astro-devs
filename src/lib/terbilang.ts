/**
 * Angka ke kata bahasa Indonesia (EYD V: bilangan ditulis terpisah; "se-" untuk 10, 11, 100, 1000).
 * Pakai BigInt supaya angka besar tidak kehilangan presisi.
 */

const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
const SKALA = ['', 'ribu', 'juta', 'miliar', 'triliun', 'kuadriliun', 'kuintiliun'];
export const MAX_DIGITS = SKALA.length * 3;

function ratusan(n: number): string {
  const r = Math.floor(n / 100);
  const sisa = n % 100;
  const out: string[] = [];
  if (r === 1) out.push('seratus');
  else if (r > 1) out.push(SATUAN[r], 'ratus');
  if (sisa >= 20) {
    out.push(SATUAN[Math.floor(sisa / 10)], 'puluh');
    if (sisa % 10) out.push(SATUAN[sisa % 10]);
  } else if (sisa >= 12) out.push(SATUAN[sisa - 10], 'belas');
  else if (sisa === 11) out.push('sebelas');
  else if (sisa === 10) out.push('sepuluh');
  else if (sisa > 0) out.push(SATUAN[sisa]);
  return out.join(' ');
}

/** Bilangan bulat (string digit) ke kata. */
export function terbilangBulat(digits: string): string {
  const clean = digits.replace(/^0+/, '');
  if (clean === '') return 'nol';
  if (!/^\d+$/.test(clean)) throw new Error('Hanya angka.');
  if (clean.length > MAX_DIGITS) throw new Error(`Maksimal ${MAX_DIGITS} digit.`);
  let n = BigInt(clean);
  const parts: string[] = [];
  let i = 0;
  while (n > 0n) {
    const grup = Number(n % 1000n);
    if (grup) {
      // 1000 = "seribu", tapi 1.000.000 = "satu juta".
      const kata = i === 1 && grup === 1 ? 'seribu' : [ratusan(grup), SKALA[i]].filter(Boolean).join(' ');
      parts.unshift(kata);
    }
    n /= 1000n;
    i++;
  }
  return parts.join(' ');
}

/** Terima "1.234.567,89" (format Indonesia) atau "1234567.89". Desimal dibaca per digit. */
export function parseAngka(input: string): { bulat: string; desimal: string; negatif: boolean } {
  let s = input.trim().replace(/\s|rp/gi, '');
  const negatif = s.startsWith('-');
  if (negatif) s = s.slice(1);
  // Koma = pemisah desimal Indonesia. Kalau tidak ada koma dan ada satu titik dengan 1-2 digit di belakang, anggap desimal.
  let bulat: string;
  let desimal = '';
  if (s.includes(',')) {
    [bulat, desimal = ''] = s.split(',');
    bulat = bulat.replace(/\./g, '');
  } else if (/^\d+\.\d{1,2}$/.test(s)) {
    [bulat, desimal] = s.split('.');
  } else {
    bulat = s.replace(/\./g, '');
  }
  if (!/^\d+$/.test(bulat) || !/^\d*$/.test(desimal)) throw new Error('Format angka tidak dikenali.');
  return { bulat, desimal, negatif };
}

export function terbilang(input: string): string {
  const { bulat, desimal, negatif } = parseAngka(input);
  let out = terbilangBulat(bulat);
  if (desimal) out += ' koma ' + [...desimal].map((d) => (d === '0' ? 'nol' : SATUAN[Number(d)])).join(' ');
  return (negatif ? 'minus ' : '') + out;
}

/** Nominal rupiah: desimal 2 digit dibaca sebagai sen (contoh EYD V: "... rupiah lima puluh sen"). */
export function terbilangRupiah(input: string): string {
  const { bulat, desimal, negatif } = parseAngka(input);
  if (desimal.length > 2) throw new Error('Rupiah maksimal 2 digit sen.');
  let out = `${terbilangBulat(bulat)} rupiah`;
  const sen = Number(desimal.padEnd(2, '0'));
  if (sen) out += ` ${terbilangBulat(String(sen))} sen`;
  return (negatif ? 'minus ' : '') + out;
}

export const kapital = (s: string) => s.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
