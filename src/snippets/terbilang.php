<?php
// Bilangan bulat 0 sampai 999 triliun (batas int 64-bit PHP).
function terbilang(int $n): string {
    $satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
    $skala = ['', 'ribu', 'juta', 'miliar', 'triliun'];
    if ($n === 0) return 'nol';
    if ($n < 0) return 'minus ' . terbilang(-$n);

    $ratusan = function (int $x) use ($satuan): string {
        $r = intdiv($x, 100);
        $s = $x % 100;
        $out = [];
        if ($r === 1) $out[] = 'seratus';
        elseif ($r > 1) array_push($out, $satuan[$r], 'ratus');
        if ($s >= 20) array_push($out, $satuan[intdiv($s, 10)], 'puluh', $satuan[$s % 10]);
        elseif ($s >= 12) array_push($out, $satuan[$s - 10], 'belas');
        elseif ($s === 11) $out[] = 'sebelas';
        elseif ($s === 10) $out[] = 'sepuluh';
        else $out[] = $satuan[$s];
        return implode(' ', array_filter($out));
    };

    $parts = [];
    for ($i = 0; $n > 0; $i++, $n = intdiv($n, 1000)) {
        $g = $n % 1000;
        if ($g === 0) continue;
        if ($i >= count($skala)) throw new InvalidArgumentException('Angka terlalu besar');
        array_unshift($parts, $i === 1 && $g === 1 ? 'seribu' : trim($ratusan($g) . ' ' . $skala[$i]));
    }
    return implode(' ', $parts);
}

echo terbilang(1250000); // satu juta dua ratus lima puluh ribu
