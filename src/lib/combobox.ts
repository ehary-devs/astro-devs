/**
 * Combobox ARIA 1.2 (input + listbox) untuk daftar pilihan yang bisa dicari.
 * Markup: <input role="combobox" aria-controls="X"> dan <ul id="X" role="listbox" hidden>.
 */
import { h } from './dom';

export type Item = { value: string; label: string };

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function combobox(input: HTMLInputElement, list: HTMLUListElement, onPick: (item: Item) => void) {
  let items: Item[] = [];
  let shown: Item[] = [];
  let active = -1;
  let picked: Item | null = null;
  // Jari/mouse sedang menekan opsi: blur jangan menutup daftar sebelum click sempat memilih.
  let pressing = false;
  const live = h('span', { class: 'sr-only', role: 'status' });
  list.after(live);

  const open = (v: boolean) => {
    list.hidden = !v;
    input.setAttribute('aria-expanded', String(v));
    if (!v) input.removeAttribute('aria-activedescendant');
  };

  function highlight() {
    list.querySelectorAll('[role=option]').forEach((el, k) => el.classList.toggle('is-active', k === active));
    if (active < 0) return input.removeAttribute('aria-activedescendant');
    const el = document.getElementById(`${list.id}-${active}`);
    input.setAttribute('aria-activedescendant', `${list.id}-${active}`);
    // Gulir daftarnya saja; scrollIntoView ikut menggulir halaman (lompat saat keyboard HP terbuka).
    if (!el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }

  function render() {
    const q = norm(input.value.trim());
    // Saat input masih berisi pilihan sekarang, tampilkan semua.
    shown = q && input.value !== picked?.label ? items.filter((i) => norm(i.label).includes(q) || i.value.includes(q)) : items;
    active = shown.length ? Math.max(0, picked ? shown.indexOf(picked) : 0) : -1;
    list.replaceChildren(
      ...(shown.length
        ? shown.map((it, k) =>
            h('li', { id: `${list.id}-${k}`, role: 'option', class: 'cb-opt', 'aria-selected': String(it === picked), 'data-k': String(k) },
              h('span', null, it.label),
              h('span', { class: 'mono text-xs text-mute' }, it.value)),
          )
        : [h('li', { class: 'cb-empty', role: 'presentation' }, 'Tidak ditemukan.')]),
    );
    live.textContent = shown.length ? `${shown.length} hasil` : 'Tidak ditemukan';
    open(true);
    highlight();
  }

  function pick(it: Item) {
    input.value = it.label;
    open(false);
    if (it === picked) return;
    picked = it;
    onPick(it);
  }

  input.addEventListener('focus', () => {
    input.select();
    render();
  });
  input.addEventListener('input', render);
  input.addEventListener('blur', () => {
    if (pressing) return;
    input.value = picked?.label ?? '';
    open(false);
  });
  input.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (list.hidden) return render();
      if (!shown.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length;
      highlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!list.hidden && active >= 0) pick(shown[active]);
    } else if (e.key === 'Escape' && !list.hidden) {
      e.preventDefault();
      input.value = picked?.label ?? '';
      open(false);
    }
  });
  // pointerdown + preventDefault: fokus tetap di input sampai klik selesai.
  list.addEventListener('pointerdown', (e) => {
    pressing = true;
    e.preventDefault();
  });
  // Sentuhan berubah jadi gulir: kalau fokus sudah pindah, tutup seperti blur biasa.
  list.addEventListener('pointercancel', () => {
    pressing = false;
    if (document.activeElement !== input) {
      input.value = picked?.label ?? '';
      open(false);
    }
  });
  list.addEventListener('click', (e) => {
    pressing = false;
    const li = (e.target as Element).closest<HTMLElement>('[data-k]');
    if (li) pick(shown[Number(li.dataset.k)]);
    else if (document.activeElement !== input) open(false);
  });

  return {
    /** Ganti isi daftar dan kosongkan pilihan. Daftar kosong = input dinonaktifkan. */
    set(next: Item[], placeholder: string) {
      items = next;
      picked = null;
      input.value = '';
      input.placeholder = placeholder;
      input.disabled = !next.length;
      live.textContent = '';
      open(false);
    },
  };
}
