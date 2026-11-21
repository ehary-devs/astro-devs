import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc16, decodeQris, toDynamic, encodeTlv, parseTlv } from '../src/lib/qris.ts';
import { validateNik, validateNpwp } from '../src/lib/nik.ts';
import { terbilang, terbilangRupiah, terbilangBulat } from '../src/lib/terbilang.ts';
import { checkPhone } from '../src/lib/phone.ts';
import { buildIcs } from '../src/lib/ics.ts';
import { LIBUR } from '../src/data/libur.ts';

// --- QRIS ---
test('crc16 check value CCITT-FALSE', () => assert.equal(crc16('123456789'), '29B1'));

// QRIS statis contoh buatan (bukan merchant asli). CRC dihitung dari body.
const body =
  '000201010211' +
  '26570011ID.DANA.WWW011893600915000000000102090000000010303UMI' +
  '51440014ID.CO.QRIS.WWW0215ID10200000000010303UMI' +
  '520454995303360' +
  '5802ID5910TOKO CONTO6007JAKARTA61051011062070703A01' +
  '6304';
const sample = body + crc16(body);

test('decode valid sample', () => {
  const r = decodeQris(sample);
  assert.deepEqual(r.issues.filter((i) => i.level === 'error'), []);
  assert.equal(r.crc?.valid, true);
  assert.equal(r.summary.method, 'statis');
  assert.equal(r.summary.merchantName, 'TOKO CONTO');
  assert.equal(r.summary.nmid, 'ID1020000000001');
  assert.equal(r.summary.criteria, 'UMI (Usaha Mikro)');
  assert.deepEqual(r.summary.acquirers, ['ID.DANA.WWW', 'ID.CO.QRIS.WWW']);
});

test('roundtrip encode', () => assert.equal(encodeTlv(parseTlv(sample)), sample));

test('crc mismatch detected', () => {
  const bad = sample.slice(0, -4) + (sample.endsWith('0000') ? '1111' : '0000');
  assert.equal(decodeQris(bad).crc?.valid, false);
});

test('truncated TLV throws', () => assert.throws(() => decodeQris(sample.slice(0, 30))));

test('toDynamic', () => {
  const d = toDynamic(sample, 15000);
  const r = decodeQris(d);
  assert.equal(r.crc?.valid, true);
  assert.equal(r.summary.method, 'dinamis');
  assert.equal(r.summary.amount, '15000');
  assert.deepEqual(r.issues.filter((i) => i.level === 'error'), []);
  assert.throws(() => toDynamic(sample, 0));
  assert.throws(() => toDynamic(sample, 1.5));
});

// --- NIK ---
const W = { '33': 'Jawa Tengah', '33.74': 'Kota Semarang', '33.74.01': 'Semarang Tengah' };
const today = new Date('2026-11-21T00:00:00Z');

test('nik laki-laki valid', () => {
  const r = validateNik('3374011708900001', W, today);
  assert.equal(r.valid, true);
  assert.equal(r.segments.find((s) => s.label === 'Jenis kelamin')?.meaning, 'Laki-laki');
  assert.match(r.segments.find((s) => s.label === 'Tanggal lahir')!.meaning, /^17-08-1990/);
});

test('nik perempuan +40', () => {
  const r = validateNik('3374015708050002', W, today);
  assert.equal(r.valid, true);
  assert.match(r.segments.find((s) => s.label === 'Jenis kelamin')!.meaning, /Perempuan/);
  assert.match(r.segments.find((s) => s.label === 'Tanggal lahir')!.meaning, /^17-08-2005 \(atau 1905\)/);
});

test('nik tanggal mustahil', () => {
  assert.equal(validateNik('3374013508900001', W, today).valid, false); // 35
  assert.equal(validateNik('3374013102900001', W, today).valid, false); // 31 Feb
  assert.equal(validateNik('337401170890000', W, today).valid, false); // 15 digit
});

test('nik 29 Feb hanya tahun kabisat', () => {
  assert.equal(validateNik('3374012902000001', W, today).valid, true); // 2000 kabisat
  assert.equal(validateNik('3374012902010001', W, today).valid, false); // 1901 & 2001 bukan kabisat
});

test('nik wilayah tidak dikenal = warning', () => {
  const r = validateNik('3374991708900001', W, today);
  assert.equal(r.valid, true);
  assert.ok(r.checks.some((c) => c.level === 'warning'));
  assert.equal(validateNik('9974011708900001', W, today).valid, false);
});

test('npwp', () => {
  assert.equal(validateNpwp('01.234.567.8-901.000').valid, true);
  assert.equal(validateNpwp('01.234.567.8-901.000').formatted, '01.234.567.8-901.000');
  assert.equal(validateNpwp('0012345678901000').type, 'NPWP 16 digit (badan)');
  assert.equal(validateNpwp('3374011708900001').type, 'NPWP 16 digit (NIK)');
  assert.equal(validateNpwp('123').valid, false);
});

// --- Terbilang ---
test('terbilang', () => {
  const cases: [string, string][] = [
    ['0', 'nol'],
    ['1', 'satu'],
    ['10', 'sepuluh'],
    ['11', 'sebelas'],
    ['12', 'dua belas'],
    ['19', 'sembilan belas'],
    ['20', 'dua puluh'],
    ['21', 'dua puluh satu'],
    ['100', 'seratus'],
    ['101', 'seratus satu'],
    ['111', 'seratus sebelas'],
    ['999', 'sembilan ratus sembilan puluh sembilan'],
    ['1000', 'seribu'],
    ['1001', 'seribu satu'],
    ['1100', 'seribu seratus'],
    ['2000', 'dua ribu'],
    ['11000', 'sebelas ribu'],
    ['100000', 'seratus ribu'],
    ['101000', 'seratus satu ribu'],
    ['1000000', 'satu juta'],
    ['1001000', 'satu juta seribu'],
    ['1000000000', 'satu miliar'],
    ['1000000000000', 'satu triliun'],
    ['55000', 'lima puluh lima ribu'],
  ];
  for (const [n, w] of cases) assert.equal(terbilangBulat(n), w, n);
  assert.equal(terbilang('1.234,5'), 'seribu dua ratus tiga puluh empat koma lima');
  assert.equal(terbilang('-7'), 'minus tujuh');
  assert.equal(terbilang('3.05'), 'tiga koma nol lima');
});

test('terbilang rupiah contoh EYD V', () => {
  assert.equal(terbilangRupiah('Rp900.500,50'), 'sembilan ratus ribu lima ratus rupiah lima puluh sen');
  assert.equal(terbilangRupiah('1.000.000'), 'satu juta rupiah');
  assert.throws(() => terbilangRupiah('1,234'));
});

// --- Phone ---
test('phone', () => {
  const m = checkPhone('0812-3456-7890');
  assert.equal(m.valid, true);
  assert.equal(m.e164, '+6281234567890');
  assert.equal(m.type, 'Seluler');
  assert.equal(m.operator?.brand, 'Telkomsel');
  assert.equal(m.waLink, 'https://wa.me/6281234567890');
  const f = checkPhone('021 5551234');
  assert.equal(f.valid, true);
  assert.equal(f.type, 'Telepon rumah/kantor');
  assert.equal(f.operator, null);
  assert.equal(checkPhone('+14155552671').valid, false);
  assert.equal(checkPhone('abc').valid, false);
});

// --- Libur ---
test('libur data konsisten', () => {
  const counts: Record<number, [number, number]> = { 2026: [17, 8], 2027: [18, 8] };
  for (const y of LIBUR) {
    const libur = y.data.filter((d) => d.jenis === 'libur').length;
    const cuti = y.data.filter((d) => d.jenis === 'cuti').length;
    assert.deepEqual([libur, cuti], counts[y.tahun], String(y.tahun));
    const dates = y.data.map((d) => d.tanggal);
    assert.deepEqual([...dates].sort(), dates, 'urut');
    assert.equal(new Set(dates).size, dates.length, 'unik');
    for (const d of dates) {
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(d.startsWith(String(y.tahun)));
      assert.equal(new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10), d);
    }
  }
});

test('libur 2027 hari sesuai SKB', () => {
  // Hari (0=Minggu) per pengumuman SKB 2027.
  const exp: Record<string, number> = {
    '2027-01-01': 5, '2027-01-05': 2, '2027-02-06': 6, '2027-03-08': 1, '2027-03-10': 3, '2027-03-11': 4,
    '2027-03-26': 5, '2027-03-28': 0, '2027-05-01': 6, '2027-05-06': 4, '2027-05-17': 1, '2027-05-20': 4,
    '2027-06-01': 2, '2027-06-06': 0, '2027-08-15': 0, '2027-08-17': 2, '2027-12-25': 6, '2027-12-26': 0,
    '2027-02-05': 5, '2027-03-09': 2, '2027-03-12': 5, '2027-03-15': 1, '2027-03-25': 4, '2027-05-18': 2,
    '2027-05-19': 3, '2027-12-24': 5,
  };
  for (const [d, dow] of Object.entries(exp)) assert.equal(new Date(`${d}T00:00:00Z`).getUTCDay(), dow, d);
});

test('ics valid', () => {
  const ics = buildIcs('Libur, Tes; 2026', LIBUR[0].data, '20261121T000000Z');
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(ics.includes('X-WR-CALNAME:Libur\\, Tes\\; 2026'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261231') === false);
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261225\r\nDTEND;VALUE=DATE:20261226'));
  assert.equal(ics.match(/BEGIN:VEVENT/g)?.length, LIBUR[0].data.length);
  for (const line of ics.split('\r\n')) assert.ok(line.length <= 75, line);
});

// --- Format input ---
import { formatRibuan, maskNik, maskNpwp } from '../src/lib/format.ts';

test('formatRibuan', () => {
  assert.equal(formatRibuan('1250000'), '1.250.000');
  assert.equal(formatRibuan('Rp 25.000'), '25.000');
  assert.equal(formatRibuan('000'), '0');
  assert.equal(formatRibuan('999'), '999');
  assert.equal(formatRibuan(''), '');
});

test('maskNik: 6-6-4, tetap lolos validateNik', () => {
  assert.equal(maskNik('3374'), '3374');
  assert.equal(maskNik('3374011708900001999'), '337401 170890 0001');
  assert.equal(validateNik(maskNik('3374011708900001'), null).digits, '3374011708900001');
});

test('maskNpwp: pola 15 digit, 16 digit per 4, tetap lolos validateNpwp', () => {
  assert.equal(maskNpwp('012'), '01.2');
  assert.equal(maskNpwp('012345678901000'), '01.234.567.8-901.000');
  assert.equal(maskNpwp('0012345678901000'), '0012 3456 7890 1000');
  assert.ok(validateNpwp(maskNpwp('012345678901000')).valid);
  assert.ok(validateNpwp(maskNpwp('0012345678901000')).valid);
});

// --- NITKU (contoh dari lampiran PER-6/PJ/2024) ---
import { detect } from '../src/lib/detect.ts';

test('nitku 22 digit', () => {
  const pusat = validateNpwp('0123456789072000000000');
  assert.equal(pusat.valid, true);
  assert.equal(pusat.type, 'NITKU 22 digit (pusat)');
  assert.equal(pusat.formatted, '0123456789072000 000000');
  assert.equal(validateNpwp('0123456789072000000001').type, 'NITKU 22 digit (cabang)');
  assert.equal(validateNpwp('3111111111111111000000').type, 'NITKU 22 digit (pusat)');
  assert.ok(validateNpwp('3111111111111111000001').checks.some((c) => c.message.includes('ke-1 (cabang)')));
  assert.equal(validateNpwp('01234567890720000000').valid, false); // 20 digit
});

test('maskNpwp 22 digit + detect', () => {
  assert.equal(maskNpwp('01234567890720000'), '0123 4567 8907 2000 0');
  assert.equal(maskNpwp('0123456789072000000000999'), '0123 4567 8907 2000 000000');
  assert.equal(validateNpwp(maskNpwp('3111111111111111000001')).valid, true);
  assert.equal(detect('0123 4567 8907 2000 000000'), 'npwp');
});

// --- Zona waktu ---
import { zonaOf } from '../src/lib/zona.ts';
import { readFileSync } from 'node:fs';

const provinsi = readFileSync(new URL('../data/wilayah.csv', import.meta.url), 'utf8').split('\n').filter((l) => /^\d\d,/.test(l)).map((l) => l.slice(0, 2));

test('zona: semua 38 provinsi terpetakan (provinsi baru di data = tes gagal)', () => {
  assert.equal(provinsi.length, 38);
  const count = { WIB: 0, WITA: 0, WIT: 0 };
  for (const p of provinsi) {
    const z = zonaOf(p);
    assert.ok(z, `provinsi ${p} belum punya zona`);
    count[z.zona]++;
  }
  assert.deepEqual(count, { WIB: 18, WITA: 12, WIT: 8 });
  assert.equal(zonaOf('61')?.iana, 'Asia/Pontianak');
  assert.equal(zonaOf('3374011708900001')?.zona, 'WIB');
  assert.equal(zonaOf('51.71')?.zona, 'WITA'); // Bali
  assert.equal(zonaOf('65')?.zona, 'WITA'); // Kaltara
  assert.equal(zonaOf('96')?.zona, 'WIT'); // Papua Barat Daya
  assert.equal(zonaOf('99'), null);
});

// --- Generator data uji ---
import { fakeOrang, kecamatanOf, mulberry32, toCsv } from '../src/lib/datauji.ts';
import { operatorOf } from '../src/lib/phone.ts';

const wilayahNik = Object.fromEntries(
  readFileSync(new URL('../data/wilayah.csv', import.meta.url), 'utf8')
    .split('\n')
    .slice(1)
    .map((l) => l.split(/,(.*)/s))
    .filter(([k]) => k && k.split('.').length <= 3)
    .map(([k, v]) => [k, v.replace(/^"|"$/g, '')]),
);

test('data uji: setiap baris lolos validator NIK, NPWP, NITKU, HP', () => {
  const kecs = kecamatanOf(wilayahNik);
  assert.equal(kecs.length, 7285);
  const r = mulberry32(42);
  for (let i = 0; i < 2000; i++) {
    const o = fakeOrang(r, wilayahNik, kecs, today);
    const nik = validateNik(o.nik, wilayahNik, today);
    assert.equal(nik.valid, true, o.nik);
    assert.ok(!nik.checks.some((c) => c.level !== 'info'), o.nik);
    const [y, m, d] = o.tanggal_lahir.split('-');
    assert.equal(nik.segments.find((s) => s.label === 'Tanggal lahir')!.meaning.slice(0, 10), `${d}-${m}-${y}`, o.nik);
    assert.equal(nik.segments.find((s) => s.label === 'Jenis kelamin')!.meaning.startsWith(o.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki'), true);
    const age = today.getUTCFullYear() - Number(y);
    assert.ok(age >= 17 && age <= 70);
    assert.equal(validateNpwp(o.npwp).type, 'NPWP 16 digit (NIK)');
    assert.equal(validateNpwp(o.nitku).type, 'NITKU 22 digit (pusat)');
    const hp = checkPhone(o.hp);
    assert.equal(hp.valid, true, o.hp);
    assert.equal(hp.type, 'Seluler', o.hp);
    assert.equal(operatorOf(o.hp)?.brand, o.operator);
    assert.ok(o.kecamatan && o.kabupaten && o.provinsi && o.zona_waktu);
  }
});

test('data uji: seed sama = hasil sama', () => {
  const kecs = kecamatanOf(wilayahNik);
  const a = fakeOrang(mulberry32(7), wilayahNik, kecs, today);
  const b = fakeOrang(mulberry32(7), wilayahNik, kecs, today);
  assert.deepEqual(a, b);
});

test('toCsv escape', () => {
  assert.equal(toCsv([{ a: '1', b: 'x,y' }, { a: 'say "hi"', b: '' }]), 'a,b\n1,"x,y"\n"say ""hi""",');
  assert.equal(toCsv([]), '');
});

// --- Jadwal sholat ---
import { slugOf, berikutnya, besok, sisaTeks, nowIn, rentang } from '../src/lib/jadwal.ts';

test('slugOf: nama Kepmendagri jadi slug URL', () => {
  assert.equal(slugOf('Kota Semarang'), 'kota-semarang');
  assert.equal(slugOf('Kota Administrasi Jakarta Pusat'), 'kota-jakarta-pusat');
  assert.equal(slugOf('Kabupaten Administrasi Kepulauan Seribu'), 'kabupaten-kepulauan-seribu');
  assert.equal(slugOf('Kabupaten Kep. Siau Tagulandang Biaro'), 'kabupaten-kep-siau-tagulandang-biaro');
});

test('slugOf: 514 kab/kota di data unik', () => {
  const rows = readFileSync('data/wilayah.csv', 'utf8').trim().split('\n').slice(1);
  const kab = rows.map((l) => l.split(',')).filter(([k]) => /^\d{2}\.\d{2}$/.test(k));
  assert.equal(kab.length, 514);
  assert.equal(new Set(kab.map(([, n]) => slugOf(n.replace(/"/g, '')))).size, 514);
});

test('berikutnya: sholat wajib berikutnya, lewati terbit/dhuha, isya -> subuh besok', () => {
  const W = ['imsak', 'subuh', 'terbit', 'dhuha', 'dzuhur', 'ashar', 'maghrib', 'isya'];
  const J = {
    '2026-12-31': ['03:40', '03:50', '05:10', '05:40', '11:40', '15:00', '18:00', '19:10'],
    '2027-01-01': ['03:41', '03:51', '05:11', '05:41', '11:41', '15:01', '18:01', '19:11'],
  };
  assert.deepEqual(berikutnya(W, J, '2026-12-31', '06:00'), { waktu: 'dzuhur', jam: '11:40', tgl: '2026-12-31', sisa: 340 });
  assert.equal(berikutnya(W, J, '2026-12-31', '03:45')?.waktu, 'subuh'); // imsak bukan sholat
  assert.deepEqual(berikutnya(W, J, '2026-12-31', '20:00'), { waktu: 'subuh', jam: '03:51', tgl: '2027-01-01', sisa: 471 });
  assert.equal(berikutnya(W, J, '2027-01-01', '20:00'), null);
  assert.equal(besok('2028-02-28'), '2028-02-29');
});

test('sisaTeks, nowIn, rentang', () => {
  assert.equal(sisaTeks(5), '5 menit lagi');
  assert.equal(sisaTeks(120), '2 jam lagi');
  assert.equal(sisaTeks(75), '1 jam 15 menit lagi');
  assert.deepEqual(nowIn('Asia/Jayapura', new Date('2026-11-21T15:45:00Z')), { tgl: '2026-11-22', jam: '00:45' });
  assert.equal(rentang([['a', ['03:53']], ['b', ['03:49']]], 0), '03:49–03:53');
});

// --- Plat nomor (Perpol 7/2021) ---
import { parsePlat, jenisDariNomor } from '../src/lib/plat.ts';
import { PLAT } from '../src/data/plat.ts';

test('plat: data lampiran A utuh', () => {
  assert.equal(PLAT.length, 57);
  assert.equal(new Set(PLAT.map((p) => p.kode)).size, 57);
  assert.equal(PLAT.reduce((n, p) => n + p.lingkup.length, 0), 501);
  assert.equal(new Set(PLAT.map((p) => p.daerah)).size, 34); // 34 provinsi saat Perpol terbit
  const by = (k: string) => PLAT.find((p) => p.kode === k)!;
  assert.deepEqual(by('L').lingkup, ['Kodya Surabaya']);
  assert.equal(by('B').lingkup.length, 7);
  assert.ok(by('B').lingkup.includes('Kota Depok'));
  assert.ok(by('A').lingkup.includes('Kab. Tangerang'));
  assert.equal(by('BB').lingkup.length, 19);
  assert.equal(by('PA').lingkup.length, 29);
  assert.equal(by('BG').lingkup.at(-1), 'Kab. Penukal Abab Lematang Ilir (PALI)'); // baris terlipat digabung
  assert.equal(by('DL').lingkup.at(-1), 'Kab. Kep. Siau Tagulandang Biaro');
  for (const p of PLAT) for (const w of p.lingkup) assert.match(w, /^(Kab\. |Kota\.? |Kodya |Kotamadya |Daerah Khusus)/, `${p.kode}: ${w}`);
});

test('plat: parse', () => {
  const r = parsePlat('b 1234 abc');
  assert.equal(r.valid, true);
  assert.equal(r.plat, 'B 1234 ABC');
  assert.equal(r.wilayah?.daerah, 'DKI Jakarta');
  assert.equal(r.jenis, 'Mobil penumpang'); // kode B: 1-2999
  assert.equal(parsePlat('H1A').jenis, 'Mobil penumpang');
  assert.equal(parsePlat('AB 2345 XY').jenis, 'Sepeda motor');
  assert.equal(parsePlat('DK 8123').jenis, 'Mobil barang');
  assert.equal(parsePlat('L 9001 ZZZ').jenis, 'Kendaraan khusus');
  assert.equal(parsePlat('RI 1').khusus?.startsWith('Dinas Presiden'), true);
  assert.equal(parsePlat('XX 123').valid, false); // kode tidak ada
  assert.equal(parsePlat('B 0123 A').valid, false); // diawali 0
  assert.equal(parsePlat('B 12345').valid, false);
  assert.equal(parsePlat('B 12 ABCD').valid, false);
  assert.equal(parsePlat('1234').valid, false);
});

test('plat: alokasi nomor lampiran C', () => {
  assert.deepEqual([1999, 2000, 6999, 7000, 8000, 9999].map((n) => jenisDariNomor('D', n)), ['Mobil penumpang', 'Sepeda motor', 'Sepeda motor', 'Mobil bus', 'Mobil barang', 'Kendaraan khusus']);
  assert.deepEqual([2999, 3000, 8500, 9000].map((n) => jenisDariNomor('B', n)), ['Mobil penumpang', 'Sepeda motor', 'Mobil penumpang', 'Mobil barang dan kendaraan khusus']);
});

test('detect plat tidak mengganggu angka', () => {
  assert.equal(detect('B 1234 ABC'), 'plat');
  assert.equal(detect('ab2345xy'), 'plat');
  assert.equal(detect('Rp 100'), 'number');
  assert.equal(detect('Rp100'), 'number');
  assert.equal(detect('halo'), 'unknown');
});
