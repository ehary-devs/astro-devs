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
