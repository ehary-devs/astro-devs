/**
 * Parser & validator QRIS (EMVCo QR Code Merchant-Presented Mode v1.1).
 * Spesifikasi teknis QRIS milik ASPI tidak publik (PADG 21/18/PADG/2019 Pasal 4-5),
 * jadi aturan di sini mengikuti EMV MPM v1.1 + pola yang dipakai di QRIS nyata.
 */

export type Tlv = { tag: string; length: number; value: string; children?: Tlv[] };
export type Issue = { level: 'error' | 'warning'; message: string };

/** CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF (EMV MPM §4.7.3.1). */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Tag yang isinya template (berisi TLV lagi). */
const isTemplate = (tag: string, parent?: string) => {
  if (parent) return false;
  const n = Number(tag);
  return (n >= 26 && n <= 51) || n === 62 || n === 64 || (n >= 80 && n <= 99);
};

export function parseTlv(input: string, parent?: string): Tlv[] {
  const out: Tlv[] = [];
  let i = 0;
  while (i < input.length) {
    const tag = input.slice(i, i + 2);
    const lenStr = input.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lenStr)) {
      throw new Error(`Format TLV rusak di posisi ${i + 1}: tag/panjang harus 2 digit angka.`);
    }
    const length = Number(lenStr);
    const value = input.slice(i + 4, i + 4 + length);
    if (value.length !== length) {
      throw new Error(`Tag ${tag} menyatakan panjang ${length}, tapi sisa data hanya ${value.length} karakter.`);
    }
    const node: Tlv = { tag, length, value };
    if (isTemplate(tag, parent)) node.children = parseTlv(value, tag);
    out.push(node);
    i += 4 + length;
  }
  return out;
}

const ROOT_NAMES: Record<string, string> = {
  '00': 'Payload Format Indicator',
  '01': 'Point of Initiation Method',
  '52': 'Merchant Category Code (MCC)',
  '53': 'Mata uang transaksi',
  '54': 'Nominal transaksi',
  '55': 'Indikator tip / biaya layanan',
  '56': 'Biaya layanan tetap',
  '57': 'Biaya layanan persentase',
  '58': 'Kode negara',
  '59': 'Nama merchant',
  '60': 'Kota merchant',
  '61': 'Kode pos',
  '62': 'Data tambahan',
  '63': 'CRC',
  '64': 'Informasi merchant bahasa alternatif',
};

const ADDITIONAL_NAMES: Record<string, string> = {
  '01': 'Nomor tagihan',
  '02': 'Nomor HP',
  '03': 'Label toko',
  '04': 'Nomor loyalitas',
  '05': 'Label referensi',
  '06': 'Label pelanggan',
  '07': 'Label terminal',
  '08': 'Tujuan transaksi',
  '09': 'Permintaan data pelanggan',
  '10': 'Nomor pajak merchant',
  '11': 'Kanal merchant',
};

const MERCHANT_ACCOUNT_NAMES: Record<string, string> = {
  '00': 'Global Unique Identifier',
  '01': 'Merchant PAN',
  '02': 'Merchant ID',
  '03': 'Kriteria merchant',
};

const LANG_NAMES: Record<string, string> = {
  '00': 'Bahasa',
  '01': 'Nama merchant (alternatif)',
  '02': 'Kota merchant (alternatif)',
};

/** Kriteria merchant QRIS (tag 51 sub 03). Diambil dari pola QRIS nyata, bukan dokumen ASPI (tidak publik). */
export const MERCHANT_CRITERIA: Record<string, string> = {
  UMI: 'Usaha Mikro',
  UKE: 'Usaha Kecil',
  UME: 'Usaha Menengah',
  UBE: 'Usaha Besar',
};

export function tagName(tag: string, parent?: string): string {
  if (!parent) {
    const n = Number(tag);
    if (n >= 2 && n <= 51) return 'Informasi akun merchant';
    if (n >= 65 && n <= 79) return 'Cadangan (RFU EMVCo)';
    if (n >= 80 && n <= 99) return 'Template tidak dicadangkan';
    return ROOT_NAMES[tag] ?? 'Tag tidak dikenal';
  }
  if (parent === '62') return ADDITIONAL_NAMES[tag] ?? (Number(tag) >= 50 ? 'Template tidak dicadangkan' : 'Cadangan');
  if (parent === '64') return LANG_NAMES[tag] ?? 'Cadangan';
  return MERCHANT_ACCOUNT_NAMES[tag] ?? 'Data spesifik penyelenggara';
}

export type QrisResult = {
  tags: Tlv[];
  issues: Issue[];
  crc: { expected: string; actual: string; valid: boolean } | null;
  summary: {
    method?: 'statis' | 'dinamis';
    merchantName?: string;
    merchantCity?: string;
    postalCode?: string;
    mcc?: string;
    amount?: string;
    nmid?: string;
    criteria?: string;
    acquirers: string[];
  };
};

const find = (tags: Tlv[], tag: string) => tags.find((t) => t.tag === tag);

export function decodeQris(raw: string): QrisResult {
  const input = raw.trim();
  const issues: Issue[] = [];
  const err = (message: string) => issues.push({ level: 'error', message });
  const warn = (message: string) => issues.push({ level: 'warning', message });

  const tags = parseTlv(input);
  const summary: QrisResult['summary'] = { acquirers: [] };

  // Urutan wajib: 00 di awal, 63 di akhir (EMV MPM §4.4).
  if (tags[0]?.tag !== '00') err('Tag 00 (Payload Format Indicator) harus menjadi tag pertama.');
  else if (tags[0].value !== '01') err(`Tag 00 harus bernilai "01", ditemukan "${tags[0].value}".`);

  const last = tags[tags.length - 1];
  let crc: QrisResult['crc'] = null;
  if (last?.tag !== '63') err('Tag 63 (CRC) harus menjadi tag terakhir.');
  else if (last.length !== 4) err('Tag 63 (CRC) harus 4 karakter.');
  else {
    // CRC dihitung atas seluruh data termasuk "6304", tanpa nilai CRC itu sendiri.
    const expected = crc16(input.slice(0, -4));
    const actual = last.value.toUpperCase();
    crc = { expected, actual, valid: expected === actual };
    if (!crc.valid) err(`CRC tidak cocok: tertulis ${actual}, seharusnya ${expected}. Data QR berubah atau rusak.`);
  }

  const seen = new Set<string>();
  for (const t of tags) {
    if (seen.has(t.tag)) err(`Tag ${t.tag} muncul lebih dari sekali.`);
    seen.add(t.tag);
  }

  const method = find(tags, '01');
  if (!method) warn('Tag 01 tidak ada. QR dianggap statis.');
  else if (method.value === '11') summary.method = 'statis';
  else if (method.value === '12') summary.method = 'dinamis';
  else err(`Tag 01 harus "11" (statis) atau "12" (dinamis), ditemukan "${method.value}".`);
  if (!method) summary.method = 'statis';

  const accounts = tags.filter((t) => Number(t.tag) >= 2 && Number(t.tag) <= 51);
  if (accounts.length === 0) err('Tidak ada informasi akun merchant (tag 02-51).');
  for (const acc of accounts) {
    const guid = acc.children ? find(acc.children, '00')?.value : undefined;
    if (guid) summary.acquirers.push(guid);
    if (acc.tag === '51' && acc.children) {
      if (guid !== 'ID.CO.QRIS.WWW') warn(`Tag 51 biasanya berisi GUID "ID.CO.QRIS.WWW", ditemukan "${guid ?? '-'}".`);
      summary.nmid = find(acc.children, '02')?.value;
      const c = find(acc.children, '03')?.value;
      if (c) summary.criteria = MERCHANT_CRITERIA[c] ? `${c} (${MERCHANT_CRITERIA[c]})` : c;
    }
  }
  if (!find(tags, '51')) warn('Tag 51 (repositori nasional QRIS, berisi NMID) tidak ditemukan. Mungkin bukan QRIS.');

  const mcc = find(tags, '52');
  if (!mcc) err('Tag 52 (MCC) wajib ada.');
  else if (!/^\d{4}$/.test(mcc.value)) err('Tag 52 (MCC) harus 4 digit angka.');
  else summary.mcc = mcc.value;

  const currency = find(tags, '53');
  if (!currency) err('Tag 53 (mata uang) wajib ada.');
  else if (currency.value !== '360') err(`Tag 53 untuk QRIS harus "360" (IDR), ditemukan "${currency.value}".`);

  const amount = find(tags, '54');
  if (amount) {
    if (!/^(?=.*\d)\d*(\.\d*)?$/.test(amount.value)) err('Tag 54 (nominal) hanya boleh angka dan satu titik desimal.');
    else summary.amount = amount.value;
  }
  if (summary.method === 'dinamis' && !amount) warn('QR dinamis biasanya menyertakan nominal (tag 54).');

  const tip = find(tags, '55');
  if (tip) {
    if (tip.value === '02' && !find(tags, '56')) err('Tag 55 = 02 (biaya tetap) tapi tag 56 tidak ada.');
    if (tip.value === '03' && !find(tags, '57')) err('Tag 55 = 03 (biaya persen) tapi tag 57 tidak ada.');
    if (!['01', '02', '03'].includes(tip.value)) err(`Tag 55 harus 01, 02, atau 03, ditemukan "${tip.value}".`);
  }

  const country = find(tags, '58');
  if (!country) err('Tag 58 (kode negara) wajib ada.');
  else if (country.value !== 'ID') err(`Tag 58 untuk QRIS harus "ID", ditemukan "${country.value}".`);

  const name = find(tags, '59');
  if (!name) err('Tag 59 (nama merchant) wajib ada.');
  else {
    summary.merchantName = name.value;
    if (name.length > 25) err('Tag 59 (nama merchant) maksimal 25 karakter.');
  }

  const city = find(tags, '60');
  if (!city) err('Tag 60 (kota merchant) wajib ada.');
  else {
    summary.merchantCity = city.value;
    if (city.length > 15) err('Tag 60 (kota merchant) maksimal 15 karakter.');
  }

  summary.postalCode = find(tags, '61')?.value;

  return { tags, issues, crc, summary };
}

/** Susun ulang TLV ke string. */
export function encodeTlv(tags: Tlv[]): string {
  return tags
    .map((t) => {
      const value = t.children ? encodeTlv(t.children) : t.value;
      if (value.length > 99) throw new Error(`Nilai tag ${t.tag} lebih dari 99 karakter.`);
      return t.tag + String(value.length).padStart(2, '0') + value;
    })
    .join('');
}

/**
 * Ubah QRIS statis jadi dinamis dengan nominal tertentu.
 * Tag 01 diubah ke "12", tag 54 diisi, tag diurutkan, lalu CRC dihitung ulang.
 */
export function toDynamic(raw: string, amount: number): string {
  if (!Number.isInteger(amount) || amount <= 0 || amount > 9_999_999_999_999) {
    throw new Error('Nominal harus bilangan bulat positif (rupiah, tanpa desimal).');
  }
  const tags = parseTlv(raw.trim()).filter((t) => !['01', '54', '63'].includes(t.tag));
  tags.push({ tag: '01', length: 2, value: '12' }, { tag: '54', length: 0, value: String(amount) });
  tags.sort((a, b) => Number(a.tag) - Number(b.tag));
  const body = encodeTlv(tags) + '6304';
  return body + crc16(body);
}
