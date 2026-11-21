import type { Libur } from '../data/libur';

/** Escape teks iCalendar (RFC 5545 §3.3.11). */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Lipat baris > 75 oktet (RFC 5545 §3.1). Teks di sini ASCII, jadi 1 karakter = 1 oktet. */
function fold(line: string): string {
  const out: string[] = [];
  for (let i = 0; i < line.length; i += i === 0 ? 75 : 74) out.push((i === 0 ? '' : ' ') + line.slice(i, i + (i === 0 ? 75 : 74)));
  return out.join('\r\n');
}

const nextDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
};

export function buildIcs(name: string, items: Libur[], stamp: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//devs.web.id//Hari Libur Indonesia//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`,
    'X-WR-TIMEZONE:Asia/Jakarta',
  ];
  for (const it of items) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${it.tanggal}-${it.jenis}@devs.web.id`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${it.tanggal.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${nextDay(it.tanggal)}`,
      `SUMMARY:${esc(it.nama)}`,
      `CATEGORIES:${it.jenis === 'cuti' ? 'Cuti Bersama' : 'Libur Nasional'}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
