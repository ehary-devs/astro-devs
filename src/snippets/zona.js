// Zona waktu dari kode wilayah Kepmendagri atau NIK (2 digit awal = provinsi). Dasar: Keppres 41/1987.
const ZONA = {
  WIB: { iana: 'Asia/Jakarta', prov: '11 12 13 14 15 16 17 18 19 21 31 32 33 34 35 36 61 62' },
  WITA: { iana: 'Asia/Makassar', prov: '51 52 53 63 64 65 71 72 73 74 75 76' },
  WIT: { iana: 'Asia/Jayapura', prov: '81 82 91 92 93 94 95 96' },
};

function zonaWaktu(kode) {
  const p = String(kode).slice(0, 2);
  return Object.keys(ZONA).find((z) => ZONA[z].prov.split(' ').includes(p)) ?? null;
}

zonaWaktu('33.74.01'); // "WIB"
zonaWaktu('7371011708900001'); // "WITA" (NIK Makassar)
new Date().toLocaleTimeString('id-ID', { timeZone: ZONA.WIT.iana }); // jam sekarang di WIT
