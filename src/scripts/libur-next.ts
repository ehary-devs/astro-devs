// Tandai baris yang sudah lewat dan libur berikutnya, berdasarkan tanggal di perangkat pengguna.
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const rows = [...document.querySelectorAll<HTMLTableRowElement>('tr[data-date]')].sort((a, b) => a.dataset.date!.localeCompare(b.dataset.date!));
for (const r of rows) if (r.dataset.date! < today) r.classList.add('text-mute');
const next = rows.find((r) => r.dataset.date! >= today);
const el = document.querySelector<HTMLElement>('#next');
if (next && el) {
  next.classList.add('bg-wash');
  const cells = next.querySelectorAll('td');
  const days = Math.round((Date.parse(next.dataset.date!) - Date.parse(today)) / 86400000);
  el.textContent = `${days === 0 ? 'Hari ini' : `${days} hari lagi`}: ${cells[1].textContent}, ${cells[0].textContent}.`;
  el.hidden = false;
}
