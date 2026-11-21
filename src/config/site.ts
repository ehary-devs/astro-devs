/**
 * Satu sumber identitas web. Semua nilai di sini publik dan ter-bake ke HTML saat build.
 * JANGAN taruh secret di file ini.
 */

export type NavLink = { label: string; href: string; icon?: string };

export const site = {
  name: 'devs.web.id',
  description:
    'Tools gratis untuk developer Indonesia: decoder QRIS, cek format NIK dan NPWP, nomor HP, terbilang, API hari libur, dan API kode wilayah. Semua diproses di browser.',
  themeColor: '#ffffff',
  author: { name: 'ehary.id', href: 'https://ehary.id' },

  nav: [
    { label: 'Tools', href: '/#tools', icon: 'layout-grid' },
    { label: 'API', href: '/api/', icon: 'api' },
    { label: 'Sumber data', href: '/sumber-data/', icon: 'database' },
  ] as NavLink[],

  footerLinks: [
    { label: 'Sumber data', href: '/sumber-data/' },
    { label: 'Privasi', href: '/privasi/' },
  ] as NavLink[],
} as const;

export type Tool = {
  slug: string;
  name: string;
  /** Satu kalimat: apa yang dikerjakan, dari sudut pengguna. */
  desc: string;
  /** Tempat proses data. 'api' = ada endpoint JSON publik. */
  runs: 'browser' | 'api';
  /** Nama ikon Tabler (lihat components/Icon.astro). */
  icon: string;
  /** Kata kunci pendek untuk chip di kartu. */
  tags: string[];
};

export const tools: Tool[] = [
  { slug: 'qris', name: 'Decoder QRIS', desc: 'Bongkar string QRIS per tag, cek CRC, dan ubah QR statis jadi dinamis dengan nominal.', runs: 'browser', icon: 'qrcode', tags: ['EMVCo', 'CRC-16', 'TLV'] },
  { slug: 'nik', name: 'Cek format NIK', desc: 'Baca kode wilayah, tanggal lahir, dan jenis kelamin dari 16 digit NIK.', runs: 'browser', icon: 'id', tags: ['PP 40/2019', 'Wilayah'] },
  { slug: 'npwp', name: 'Cek format NPWP', desc: 'Kenali NPWP 15 dan 16 digit, lengkap dengan konversi ke format baru.', runs: 'browser', icon: 'receipt-tax', tags: ['PMK 112/2022', '16 digit'] },
  { slug: 'nomor-hp', name: 'Cek nomor HP', desc: 'Validasi nomor Indonesia, jenis nomor, operator, dan format E.164.', runs: 'browser', icon: 'device-mobile', tags: ['E.164', 'Operator', 'wa.me'] },
  { slug: 'terbilang', name: 'Terbilang rupiah', desc: 'Ubah angka jadi kata sesuai EYD V, plus fungsi siap salin untuk JS, PHP, dan Python.', runs: 'browser', icon: 'abc', tags: ['EYD V', 'JS', 'PHP', 'Python'] },
  { slug: 'hari-libur', name: 'Hari libur nasional', desc: 'Libur dan cuti bersama dari SKB 3 Menteri, dalam JSON dan kalender .ics.', runs: 'api', icon: 'calendar-event', tags: ['JSON', '.ics', 'SKB'] },
  { slug: 'wilayah', name: 'Kode wilayah', desc: 'Provinsi sampai desa sesuai Kepmendagri 2025, sebagai JSON statis.', runs: 'api', icon: 'map-pin', tags: ['JSON', 'Kepmendagri'] },
];
