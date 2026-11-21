/**
 * Zona waktu per provinsi. Dasar: Keppres 41/1987 Pasal 1 (berlaku 1 Januari 1988), masih berlaku.
 * Keppres menyebut provinsi tahun 1987; provinsi hasil pemekaran mengikuti provinsi induknya:
 * Babel dan Kepri (Sumatera), Banten (Jawa), Kaltara (Kaltim), Gorontalo dan Sulbar (Sulawesi),
 * Maluku Utara (Maluku), enam provinsi Papua (Irian Jaya).
 */

export type Zona = { zona: 'WIB' | 'WITA' | 'WIT'; utc: '+07:00' | '+08:00' | '+09:00'; iana: string };

const PROV: [codes: string, z: Zona][] = [
  ['11 12 13 14 15 16 17 18 19 21 31 32 33 34 35 36', { zona: 'WIB', utc: '+07:00', iana: 'Asia/Jakarta' }],
  // Kalbar dan Kalteng: IANA memisahkan zona Asia/Pontianak (offset sama, sejarah berbeda).
  ['61 62', { zona: 'WIB', utc: '+07:00', iana: 'Asia/Pontianak' }],
  ['51 52 53 63 64 65 71 72 73 74 75 76', { zona: 'WITA', utc: '+08:00', iana: 'Asia/Makassar' }],
  ['81 82 91 92 93 94 95 96', { zona: 'WIT', utc: '+09:00', iana: 'Asia/Jayapura' }],
];

/** Kode wilayah level apa pun ("33", "33.74.01", atau 6 digit awal NIK) → zona waktu. */
export function zonaOf(kode: string): Zona | null {
  const p = kode.slice(0, 2);
  return PROV.find(([codes]) => codes.split(' ').includes(p))?.[1] ?? null;
}
