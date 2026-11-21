/**
 * Hari libur nasional & cuti bersama, persis dari SKB 3 Menteri.
 * Tambah tahun baru setiap SKB terbit (biasanya September). Jangan ambil dari kalender pihak ketiga.
 */

export type Libur = { tanggal: string; nama: string; jenis: 'libur' | 'cuti' };
export type TahunLibur = { tahun: number; dasar: string; ditetapkan: string; sumber: string; catatan?: string; data: Libur[] };

const l = (tanggal: string, nama: string): Libur => ({ tanggal, nama, jenis: 'libur' });
const c = (tanggal: string, nama: string): Libur => ({ tanggal, nama, jenis: 'cuti' });

export const LIBUR: TahunLibur[] = [
  {
    tahun: 2026,
    dasar: 'SKB Menteri Agama No. 1497 Tahun 2025, Menteri Ketenagakerjaan No. 2 Tahun 2025, dan MenPANRB No. 5 Tahun 2025',
    ditetapkan: '2025-09-19',
    sumber: 'https://setneg.go.id/baca/index/inilah_skb_3_menteri_libur_nasional_dan_cuti_bersama_2026',
    data: [
      l('2026-01-01', 'Tahun Baru 2026 Masehi'),
      l('2026-01-16', 'Isra Mikraj Nabi Muhammad SAW'),
      c('2026-02-16', 'Cuti bersama Tahun Baru Imlek 2577 Kongzili'),
      l('2026-02-17', 'Tahun Baru Imlek 2577 Kongzili'),
      c('2026-03-18', 'Cuti bersama Hari Suci Nyepi'),
      l('2026-03-19', 'Hari Suci Nyepi (Tahun Baru Saka 1948)'),
      c('2026-03-20', 'Cuti bersama Idulfitri 1447 H'),
      l('2026-03-21', 'Idulfitri 1447 H'),
      l('2026-03-22', 'Idulfitri 1447 H'),
      c('2026-03-23', 'Cuti bersama Idulfitri 1447 H'),
      c('2026-03-24', 'Cuti bersama Idulfitri 1447 H'),
      l('2026-04-03', 'Wafat Yesus Kristus'),
      l('2026-04-05', 'Kebangkitan Yesus Kristus (Paskah)'),
      l('2026-05-01', 'Hari Buruh Internasional'),
      l('2026-05-14', 'Kenaikan Yesus Kristus'),
      c('2026-05-15', 'Cuti bersama Kenaikan Yesus Kristus'),
      l('2026-05-27', 'Iduladha 1447 H'),
      c('2026-05-28', 'Cuti bersama Iduladha 1447 H'),
      l('2026-05-31', 'Hari Raya Waisak 2570 BE'),
      l('2026-06-01', 'Hari Lahir Pancasila'),
      l('2026-06-16', '1 Muharam Tahun Baru Islam 1448 H'),
      l('2026-08-17', 'Proklamasi Kemerdekaan'),
      l('2026-08-25', 'Maulid Nabi Muhammad SAW'),
      c('2026-12-24', 'Cuti bersama Kelahiran Yesus Kristus'),
      l('2026-12-25', 'Kelahiran Yesus Kristus'),
    ],
  },
  {
    tahun: 2027,
    dasar: 'SKB Menteri Agama No. 1205 Tahun 2026, Menteri Ketenagakerjaan No. 3 Tahun 2026, dan MenPANRB No. 2 Tahun 2026',
    ditetapkan: '2026-09-15',
    sumber: 'https://setneg.go.id/baca/index/inilah_skb_3_menteri_libur_nasional_dan_cuti_bersama_2027',
    catatan: 'Tanggal 1 Ramadan, Idulfitri, dan Iduladha mengikuti keputusan Menteri Agama (sidang isbat).',
    data: [
      l('2027-01-01', 'Tahun Baru 2027 Masehi'),
      l('2027-01-05', 'Isra Mikraj Nabi Muhammad SAW'),
      c('2027-02-05', 'Cuti bersama Tahun Baru Imlek 2578 Kongzili'),
      l('2027-02-06', 'Tahun Baru Imlek 2578 Kongzili'),
      l('2027-03-08', 'Hari Suci Nyepi (Tahun Baru Saka 1949)'),
      c('2027-03-09', 'Cuti bersama Idulfitri 1448 H'),
      l('2027-03-10', 'Idulfitri 1448 H'),
      l('2027-03-11', 'Idulfitri 1448 H'),
      c('2027-03-12', 'Cuti bersama Idulfitri 1448 H'),
      c('2027-03-15', 'Cuti bersama Idulfitri 1448 H'),
      c('2027-03-25', 'Cuti bersama Wafat Yesus Kristus'),
      l('2027-03-26', 'Wafat Yesus Kristus'),
      l('2027-03-28', 'Hari Kebangkitan Yesus Kristus (Paskah)'),
      l('2027-05-01', 'Hari Buruh Internasional'),
      l('2027-05-06', 'Kenaikan Yesus Kristus'),
      l('2027-05-17', 'Iduladha 1448 H'),
      c('2027-05-18', 'Cuti bersama Iduladha 1448 H'),
      c('2027-05-19', 'Cuti bersama Hari Raya Waisak'),
      l('2027-05-20', 'Hari Raya Waisak 2571 BE'),
      l('2027-06-01', 'Hari Lahir Pancasila'),
      l('2027-06-06', '1 Muharam Tahun Baru Islam 1449 H'),
      l('2027-08-15', 'Maulid Nabi Muhammad SAW'),
      l('2027-08-17', 'Proklamasi Kemerdekaan'),
      c('2027-12-24', 'Cuti bersama Kelahiran Yesus Kristus (Natal)'),
      l('2027-12-25', 'Kelahiran Yesus Kristus (Natal)'),
      l('2027-12-26', 'Isra Mikraj Nabi Muhammad SAW'),
    ],
  },
];
