/**
 * Helper DOM tanpa innerHTML (CSP pakai require-trusted-types-for 'script').
 * Semua teks lewat textContent, jadi input user aman ditampilkan.
 */

type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | undefined> | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) if (v !== undefined) el.setAttribute(k, v);
  for (const c of children) if (c) el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return el;
}

export const clear = (el: Element) => el.replaceChildren();

export function bindCopy(btn: HTMLButtonElement, get: () => string) {
  // Kalau tombol punya ikon, hanya teks di [data-label] yang diganti.
  const label = btn.querySelector<HTMLElement>('[data-label]') ?? btn;
  const idle = label.textContent ?? 'Salin';
  label.setAttribute('aria-live', 'polite');
  let timer: ReturnType<typeof setTimeout> | undefined;
  btn.addEventListener('click', async () => {
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(get());
      label.textContent = 'Tersalin';
    } catch {
      label.textContent = 'Gagal menyalin';
    }
    timer = setTimeout(() => (label.textContent = idle), 1500);
  });
}

/** Baris status: titik warna + teks. level: ok | bad | warn | info. */
export const status = (level: 'ok' | 'bad' | 'warn' | 'info', text: string) => h('p', { class: `status is-${level}` }, text);

/** Tabel 2 kolom label → nilai (nilai mono). */
export function kv(rows: [string, string | Node][]) {
  return h(
    'table',
    { class: 'table' },
    h('tbody', null, ...rows.map(([k, v]) => h('tr', null, h('th', { scope: 'row', class: 'w-40 !border-line !text-mute' }, k), h('td', { class: 'mono break-all' }, v)))),
  );
}
