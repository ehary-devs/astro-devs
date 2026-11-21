import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

/**
 * Prefix seluler awal per operator. Indonesia belum menerapkan portabilitas nomor,
 * jadi prefix = operator penerbit. Merek per 2025: XL + Smartfren bergabung jadi XLSmart,
 * Indosat + Tri jadi Indosat Ooredoo Hutchison.
 */
const PREFIX: [string[], string, string][] = [
  [['0811', '0812', '0813', '0821', '0822', '0823', '0851', '0852', '0853'], 'Telkomsel', 'Telkomsel'],
  [['0814', '0815', '0816', '0855', '0856', '0857', '0858'], 'Indosat (IM3)', 'Indosat Ooredoo Hutchison'],
  [['0895', '0896', '0897', '0898', '0899'], 'Tri', 'Indosat Ooredoo Hutchison'],
  [['0817', '0818', '0819', '0859', '0877', '0878'], 'XL', 'XLSmart'],
  [['0831', '0832', '0833', '0838'], 'AXIS', 'XLSmart'],
  [['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'], 'Smartfren', 'XLSmart'],
];

export function operatorOf(national: string): { brand: string; company: string } | null {
  const p = national.slice(0, 4);
  for (const [list, brand, company] of PREFIX) if (list.includes(p)) return { brand, company };
  return null;
}

export type PhoneResult = {
  valid: boolean;
  message: string;
  e164?: string;
  national?: string;
  international?: string;
  type?: string;
  operator?: { brand: string; company: string } | null;
  waLink?: string;
};

const TYPE_ID: Record<string, string> = {
  MOBILE: 'Seluler',
  FIXED_LINE: 'Telepon rumah/kantor',
  FIXED_LINE_OR_MOBILE: 'Tetap atau seluler',
  TOLL_FREE: 'Bebas pulsa',
  PREMIUM_RATE: 'Premium',
  VOIP: 'VoIP',
  UAN: 'Nomor universal',
};

export function checkPhone(input: string): PhoneResult {
  const raw = input.trim();
  if (!/^[+\d\s().-]{6,20}$/.test(raw)) return { valid: false, message: 'Isi hanya angka, spasi, +, -, atau tanda kurung (6-20 karakter).' };
  const pn = parsePhoneNumberFromString(raw, 'ID');
  if (!pn) return { valid: false, message: 'Nomor tidak bisa dibaca.' };
  if (pn.country && pn.country !== 'ID') return { valid: false, message: `Ini nomor negara ${pn.country}, bukan Indonesia.` };
  if (!pn.isValid()) return { valid: false, message: 'Panjang atau prefix tidak sesuai penomoran Indonesia.' };
  const type = pn.getType();
  const nationalDigits = '0' + pn.nationalNumber;
  const mobile = type === 'MOBILE';
  return {
    valid: true,
    message: 'Format nomor valid.',
    e164: pn.number,
    national: pn.formatNational(),
    international: pn.formatInternational(),
    type: type ? (TYPE_ID[type] ?? type) : 'Tidak diketahui',
    operator: mobile ? operatorOf(nationalDigits) : null,
    waLink: mobile ? `https://wa.me/${pn.number.slice(1)}` : undefined,
  };
}
