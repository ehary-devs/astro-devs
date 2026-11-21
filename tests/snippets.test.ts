// Snippet yang tampil di halaman harus memberi hasil sama dengan library yang sudah dites.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { terbilangBulat } from '../src/lib/terbilang.ts';
import { crc16 } from '../src/lib/qris.ts';

const read = (f: string) => readFileSync(new URL(`../src/snippets/${f}`, import.meta.url), 'utf8');
const has = (bin: string) => {
  try {
    execFileSync(bin, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const nums = [
  ...Array.from({ length: 2101 }, (_, i) => i),
  10000, 10001, 11000, 12345, 99999, 100000, 101000, 110000, 999999, 1000000, 1000001, 1001000, 1250000,
  12345678, 100000000, 999999999, 1000000000, 1001001001, 123456789012, 1000000000000, 999999999999999,
];
const expected = nums.map((n) => terbilangBulat(String(n)));
const crcInputs = ['123456789', '', 'A', '000201010211520454995303360', 'x'.repeat(200)];
const crcExpected = crcInputs.map(crc16);

test('crc16 check value di library', () => assert.equal(crc16('123456789'), '29B1'));

test('snippet JS terbilang', () => {
  const fn = new Function(`${read('terbilang.js')}; return terbilang;`)();
  nums.forEach((n, i) => assert.equal(fn(n), expected[i], String(n)));
  assert.equal(fn(-5), 'minus lima');
});

test('snippet JS crc16', () => {
  const fn = new Function(`${read('crc16.js')}; return crc16;`)();
  crcInputs.forEach((s, i) => assert.equal(fn(s), crcExpected[i]));
});

test('snippet Python', { skip: !has('python3') }, () => {
  const code = `${read('terbilang.py').replace(/^print\(.*$/m, '')}
${read('crc16.py')}
import json, sys
d = json.load(sys.stdin)
print(json.dumps({"t": [terbilang(n) for n in d["nums"]], "c": [crc16(s) for s in d["crc"]]}))`;
  const res = JSON.parse(execFileSync('python3', ['-I', '-c', code], { input: JSON.stringify({ nums, crc: crcInputs }) }).toString());
  assert.deepEqual(res.t, expected);
  assert.deepEqual(res.c, crcExpected);
});

test('snippet PHP', { skip: !has('php') }, () => {
  const strip = (s: string) => s.replace(/^<\?php\s*/, '').replace(/^echo .*$/m, '');
  const code = `${strip(read('terbilang.php'))}
${strip(read('crc16.php'))}
$d = json_decode(stream_get_contents(STDIN), true);
echo json_encode(["t" => array_map('terbilang', $d["nums"]), "c" => array_map('crc16', $d["crc"])]);`;
  const res = JSON.parse(execFileSync('php', ['-r', code], { input: JSON.stringify({ nums, crc: crcInputs }) }).toString());
  assert.deepEqual(res.t, expected);
  assert.deepEqual(res.c, crcExpected);
});
