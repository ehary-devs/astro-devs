const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
const SKALA = ['', 'ribu', 'juta', 'miliar', 'triliun'];

function ratusan(n) {
  const r = Math.floor(n / 100), s = n % 100, out = [];
  if (r === 1) out.push('seratus');
  else if (r > 1) out.push(SATUAN[r], 'ratus');
  if (s >= 20) out.push(SATUAN[Math.floor(s / 10)], 'puluh', SATUAN[s % 10]);
  else if (s >= 12) out.push(SATUAN[s - 10], 'belas');
  else if (s === 11) out.push('sebelas');
  else if (s === 10) out.push('sepuluh');
  else out.push(SATUAN[s]);
  return out.filter(Boolean).join(' ');
}

// Bilangan bulat 0 sampai 999 triliun. Untuk angka di atas 2^53, kirim sebagai BigInt.
function terbilang(angka) {
  let n = BigInt(angka);
  if (n === 0n) return 'nol';
  if (n < 0n) return 'minus ' + terbilang(-n);
  const parts = [];
  for (let i = 0; n > 0n; i++, n /= 1000n) {
    const g = Number(n % 1000n);
    if (!g) continue;
    if (i >= SKALA.length) throw new Error('Angka terlalu besar');
    parts.unshift(i === 1 && g === 1 ? 'seribu' : [ratusan(g), SKALA[i]].filter(Boolean).join(' '));
  }
  return parts.join(' ');
}

terbilang(1250000); // "satu juta dua ratus lima puluh ribu"
