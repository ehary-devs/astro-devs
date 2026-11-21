import type { APIRoute, GetStaticPaths } from 'astro';
import { LIBUR, type TahunLibur } from '../../../data/libur';

export const getStaticPaths = (() => LIBUR.map((t) => ({ params: { tahun: String(t.tahun) }, props: { t } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const { t } = props as { t: TahunLibur };
  return new Response(JSON.stringify(t, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
