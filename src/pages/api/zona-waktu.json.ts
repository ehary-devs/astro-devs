import type { APIRoute } from 'astro';
import { PROVINSI } from '../../data/provinsi';
import { zonaOf } from '../../lib/zona';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(PROVINSI.map((p) => ({ ...p, ...zonaOf(p.kode)! })), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
