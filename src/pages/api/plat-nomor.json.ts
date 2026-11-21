import type { APIRoute } from 'astro';
import { PLAT } from '../../data/plat';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(PLAT, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
