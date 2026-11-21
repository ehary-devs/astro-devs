import type { APIRoute, GetStaticPaths } from 'astro';
import { LIBUR, type Libur } from '../../data/libur';
import { buildIcs } from '../../lib/ics';

const all = LIBUR.flatMap((t) => t.data);
const files: Record<string, { name: string; items: Libur[] }> = {
  // Langganan: berisi semua tahun, ikut bertambah.
  'libur-indonesia': { name: 'Libur Nasional & Cuti Bersama Indonesia', items: all },
  'libur-nasional': { name: 'Libur Nasional Indonesia', items: all.filter((d) => d.jenis === 'libur') },
  // Per tahun: untuk impor sekali.
  ...Object.fromEntries(LIBUR.map((t) => [`libur-${t.tahun}`, { name: `Libur Nasional & Cuti Bersama ${t.tahun}`, items: t.data }])),
};

export const getStaticPaths = (() => Object.keys(files).map((file) => ({ params: { file } }))) satisfies GetStaticPaths;

// DTSTAMP tetap (bukan waktu build) supaya file tidak berubah tiap deploy.
const STAMP = '20260921T000000Z';

export const GET: APIRoute = ({ params }) =>
  new Response(buildIcs(files[params.file!].name, files[params.file!].items, STAMP), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
