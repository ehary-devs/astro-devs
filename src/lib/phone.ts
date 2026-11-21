import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { operatorOf } from './operator.ts';

export { operatorOf };

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
