// Terpisah dari phone.ts supaya halaman yang hanya butuh prefix tidak ikut memuat libphonenumber (~190 KB).

/**
 * Prefix seluler awal per operator. Indonesia belum menerapkan portabilitas nomor,
 * jadi prefix = operator penerbit. Merek per 2025: XL + Smartfren bergabung jadi XLSmart,
 * Indosat + Tri jadi Indosat Ooredoo Hutchison.
 */
export const PREFIX: [string[], string, string][] = [
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
