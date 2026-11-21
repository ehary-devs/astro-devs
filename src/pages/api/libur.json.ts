import type { APIRoute } from 'astro';
import { LIBUR } from '../../data/libur';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ tahun: LIBUR.map((t) => t.tahun), data: LIBUR }, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
