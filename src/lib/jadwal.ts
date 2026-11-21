/** Logika jadwal sholat yang dipakai saat build dan di browser (tanpa DOM, tanpa fs). */

export type Jadwal = Record<string, string[]>;
export type Lokasi = { nama: string; lat: number; lng: number; jadwal: Jadwal };
export type JadwalFile = Lokasi & { kode: string; tahun: number; waktu: string[]; titik?: Lokasi[] };

export const LABEL: Record<string, string> = {
  imsak: 'Imsak', subuh: 'Subuh', terbit: 'Terbit', dhuha: 'Dhuha',
  dzuhur: 'Dzuhur', ashar: 'Ashar', maghrib: 'Maghrib', isya: 'Isya',
};
/** Lima waktu sholat wajib; imsak/terbit/dhuha hanya penanda. */
export const WAJIB = new Set(['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']);
export const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** "Kota Administrasi Jakarta Pusat" -> "kota-jakarta-pusat" (orang mencari "jadwal sholat jakarta pusat"). */
export const slugOf = (nama: string) =>
  nama
    .toLowerCase()
    .replace(/\badministrasi\b/g, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const menit = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Tanggal & jam sekarang di zona IANA tertentu, bukan zona perangkat. */
export function nowIn(iana: string, at = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: iana, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(at)
      .map((x) => [x.type, x.value]),
  );
  return { tgl: `${p.year}-${p.month}-${p.day}`, jam: `${p.hour}:${p.minute}` };
}

/** "2026-11-21" -> "2026-11-22" (UTC, jadi aman dari DST/zona perangkat). */
export const besok = (tgl: string) => new Date(Date.parse(`${tgl}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);

/**
 * Sholat wajib berikutnya setelah `jam` pada `tgl`. Lewat isya -> subuh besok.
 * null kalau data besok tidak ada (akhir tahun terakhir).
 */
export function berikutnya(waktu: string[], jadwal: Jadwal, tgl: string, jam: string) {
  const now = menit(jam);
  const hari = jadwal[tgl];
  if (hari) {
    const i = waktu.findIndex((w, k) => WAJIB.has(w) && menit(hari[k]) > now);
    if (i >= 0) return { waktu: waktu[i], jam: hari[i], tgl, sisa: menit(hari[i]) - now };
  }
  const b = jadwal[besok(tgl)];
  const s = waktu.indexOf('subuh');
  if (!b || s < 0) return null;
  return { waktu: 'subuh', jam: b[s], tgl: besok(tgl), sisa: 1440 - now + menit(b[s]) };
}

export const sisaTeks = (m: number) => {
  const j = Math.floor(m / 60);
  const d = m % 60;
  return j ? (d ? `${j} jam ${d} menit lagi` : `${j} jam lagi`) : `${d} menit lagi`;
};

/** Baris satu bulan ("2026-11") dari jadwal setahun. */
export const bulanRows = (jadwal: Jadwal, ym: string) => Object.entries(jadwal).filter(([t]) => t.startsWith(ym));

/** "Sab" untuk 2026-11-21. */
export const hariPendek = (tgl: string) =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${tgl}T00:00:00Z`));

/** Rentang jam satu waktu dalam sebulan, contoh "03:49–03:53" (untuk teks ringkasan SEO). */
export function rentang(rows: [string, string[]][], idx: number) {
  const v = rows.map(([, r]) => r[idx]).sort();
  return v[0] === v[v.length - 1] ? v[0] : `${v[0]}–${v[v.length - 1]}`;
}
