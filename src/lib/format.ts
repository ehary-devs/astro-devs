/** Format tampilan input saat diketik. Validator (nik.ts, phone.ts, qris.ts) tetap membuang pemisah sendiri. */

export const digitsOnly = (s: string) => s.replace(/\D/g, '');

/** 1250000 → "1.250.000" (pemisah ribuan Indonesia). */
export const formatRibuan = (s: string) =>
  digitsOnly(s)
    .replace(/^0+(?=\d)/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** NIK 16 digit dikelompokkan sesuai strukturnya: wilayah, tanggal lahir, nomor urut. */
export function maskNik(s: string) {
  const d = digitsOnly(s).slice(0, 16);
  return [d.slice(0, 6), d.slice(6, 12), d.slice(12)].filter(Boolean).join(' ');
}

/** NPWP: sampai 15 digit pakai pola lama 99.999.999.9-999.999, 16 digit dikelompokkan 4-4-4-4. */
export function maskNpwp(s: string) {
  const d = digitsOnly(s).slice(0, 16);
  if (d.length === 16) return d.match(/.{4}/g)!.join(' ');
  const cuts: [number, number, string][] = [[0, 2, ''], [2, 5, '.'], [5, 8, '.'], [8, 9, '.'], [9, 12, '-'], [12, 15, '.']];
  let out = '';
  for (const [a, b, sep] of cuts) {
    const part = d.slice(a, b);
    if (!part) break;
    out += sep + part;
  }
  return out;
}

/**
 * Pasang format ke input, posisi kursor dijaga berdasarkan jumlah digit di kiri kursor.
 * Panggil sebelum listener 'input' lain supaya mereka membaca nilai yang sudah diformat.
 */
export function bindMask(input: HTMLInputElement, fmt: (v: string) => string) {
  let last = input.value;
  function apply(e: Event) {
    // Jangan ubah nilai saat IME masih menyusun teks; diformat di compositionend.
    if ((e as InputEvent).isComposing) return;
    let v = input.value;
    let pos = input.selectionStart ?? v.length;
    // Backspace mengenai pemisah: hapus digit di kirinya, kalau tidak pemisah langsung muncul lagi.
    if ((e as InputEvent).inputType === 'deleteContentBackward' && digitsOnly(v) === digitsOnly(last) && pos > 0) {
      const left = v.slice(0, pos).replace(/\d(?=\D*$)/, '');
      v = left + v.slice(pos);
      pos = left.length;
    }
    const before = digitsOnly(v.slice(0, pos)).length;
    const next = fmt(v);
    input.value = next;
    last = next;
    let i = 0;
    if (pos >= v.length) i = next.length;
    else for (let n = 0; i < next.length && n < before; i++) if (/\d/.test(next[i])) n++;
    if (document.activeElement === input) input.setSelectionRange(i, i);
  }
  input.addEventListener('input', apply);
  // Beri tahu listener lain (render hasil) setelah nilai akhir IME diformat.
  input.addEventListener('compositionend', () => input.dispatchEvent(new Event('input')));
}
