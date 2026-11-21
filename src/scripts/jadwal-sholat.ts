/** Halaman satu kab/kota: kartu sholat berikutnya, jadwal hari ini, tabel bulan. Markup awal dari build. */
import { clear, h } from '../lib/dom';
import { BULAN, LABEL, WAJIB, berikutnya, bulanRows, hariPendek, nowIn, rentang, sisaTeks, type JadwalFile, type Lokasi } from '../lib/jadwal';

const root = document.querySelector<HTMLElement>('#jd')!;
const { kode, iana, zona } = root.dataset as { kode: string; iana: string; zona: string };
const tahunAda = root.dataset.tahun!.split(' ');
const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
const bulan = $<HTMLSelectElement>('#jd-bulan');
const titik = root.querySelector<HTMLSelectElement>('#jd-titik');

const cache = new Map<string, Promise<JadwalFile | null>>();
const load = (tahun: string) => {
  if (!cache.has(tahun)) {
    cache.set(
      tahun,
      (async () => {
        const url = `/api/jadwal-sholat/${tahun}/${kode}.json`;
        // 404 ikut ter-cache sehari (Cache-Control di _headers): sekali gagal, minta ulang lewati cache.
        let res = await fetch(url);
        if (!res.ok) res = await fetch(url, { cache: 'reload' });
        return res.ok ? res.json() : null;
      })().catch(() => null),
    );
  }
  return cache.get(tahun)!;
};
const lokasi = (d: JadwalFile): Lokasi => [d, ...(d.titik ?? [])][Number(titik?.value) || 0];

const tanggalPanjang = (tgl: string) =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${tgl}T00:00:00Z`));

async function renderHari() {
  const n = nowIn(iana);
  const tahun = n.tgl.slice(0, 4);
  const d = await load(tahun);
  $('#jd-tanggal').textContent = `${tanggalPanjang(n.tgl)} · ${zona}`;
  const next = $('#jd-next');
  const list = $('#jd-hari');
  if (!d) {
    clear(list);
    next.replaceChildren(h('p', { class: 'opacity-80' }, `Jadwal ${tahun} belum tersedia.`));
    return;
  }
  const L = lokasi(d);
  // Lewat isya 31 Desember: subuh besok ada di file tahun berikutnya.
  const nb = n.tgl.endsWith('-12-31') ? await load(String(Number(tahun) + 1)) : null;
  const gabung = nb ? { ...L.jadwal, ...lokasi(nb).jadwal } : L.jadwal;
  const b = berikutnya(d.waktu, gabung, n.tgl, n.jam);
  next.replaceChildren(
    h('p', { class: 'mono text-[0.75rem] uppercase tracking-[0.08em] text-paper/60' }, b && b.tgl !== n.tgl ? 'Sholat berikutnya · besok' : 'Sholat berikutnya'),
    b
      ? h('p', { class: 'mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1' },
          h('span', { class: 'text-[clamp(1.75rem,1.2rem+2vw,2.5rem)] font-semibold tracking-[-0.02em]' }, LABEL[b.waktu]),
          h('span', { class: 'mono text-[clamp(2.5rem,1.6rem+3.5vw,4rem)] font-semibold leading-none tracking-[-0.03em]' }, b.jam))
      : h('p', { class: 'mt-3 text-2xl font-semibold' }, '-'),
    ...(b ? [h('p', { class: 'mt-3 flex items-center gap-2 text-paper/80' }, h('span', { class: 'inline-block size-2 bg-brand', 'aria-hidden': 'true' }), sisaTeks(b.sisa))] : []),
  );

  const hari = L.jadwal[n.tgl];
  if (!hari) return clear(list);
  list.replaceChildren(
    ...d.waktu.map((w, i) => {
      const isNext = !!b && b.tgl === n.tgl && b.waktu === w;
      const lewat = hari[i] <= n.jam;
      const cls = [
        'flex flex-col gap-1 border px-3 py-3',
        isNext ? 'border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)]' : WAJIB.has(w) ? 'border-line-2 bg-paper' : 'border-transparent bg-wash',
        lewat && !isNext ? 'opacity-45' : '',
      ].join(' ');
      return h('li', { class: cls, ...(isNext ? { 'aria-current': 'time' } : {}) },
        h('span', { class: `text-[0.8125rem] ${WAJIB.has(w) ? 'text-ink-2' : 'text-mute'}` }, LABEL[w]),
        h('span', { class: 'mono text-lg font-semibold tracking-[-0.01em]' }, hari[i]));
    }),
  );
}

async function renderBulan() {
  const ym = bulan.value;
  const [tahun, m] = ym.split('-');
  $('#jd-bulan-label').textContent = `${BULAN[Number(m) - 1]} ${tahun}`;
  const d = await load(tahun);
  const body = $('#jd-tbody');
  if (ym !== bulan.value) return; // pilihan sudah berganti
  if (!d) return body.replaceChildren(h('tr', null, h('td', { colspan: '9', class: 'text-mute' }, `Jadwal ${tahun} belum tersedia.`)));
  const L = lokasi(d);
  const rows = bulanRows(L.jadwal, ym);
  const today = nowIn(iana).tgl;
  body.replaceChildren(
    ...rows.map(([t, v]) =>
      h('tr', t === today ? { class: 'bg-wash font-semibold', 'aria-current': 'date' } : null,
        h('td', { class: 'whitespace-nowrap' }, h('span', { class: 'mono' }, t.slice(8)), ' ', h('span', { class: hariPendek(t) === 'Jum' ? 'text-brand' : 'text-mute' }, hariPendek(t))),
        ...v.map((x, i) => h('td', { class: `mono ${WAJIB.has(d.waktu[i]) ? '' : 'text-mute'}` }, x))),
    ),
  );
  $('#jd-ringkas').textContent = ['subuh', 'maghrib', 'isya'].map((w) => `${LABEL[w]} ${rentang(rows, d.waktu.indexOf(w))}`).join(' · ');
  $('#jd-titik-info').textContent = `Titik acuan ${L.lat}, ${L.lng}`;
}

const ini = nowIn(iana).tgl.slice(0, 7);
if (tahunAda.includes(ini.slice(0, 4))) bulan.value = ini;
bulan.addEventListener('change', renderBulan);
titik?.addEventListener('change', () => (renderHari(), renderBulan()));
renderHari();
renderBulan();
// Hitung mundur cukup per 30 detik; jadwal dalam menit.
setInterval(renderHari, 30_000);
