# devs.web.id

Tools gratis untuk developer Indonesia: decoder QRIS, cek format NIK/NPWP, nomor HP, terbilang, hari libur (JSON + .ics), dan kode wilayah (JSON statis). Semua diproses di browser. Dibangun dari `astro-cf-starter` (Astro static + Cloudflare Workers Static Assets). Aturan wajib ada di `AGENTS.md`.

## Perintah

| Perintah       | Fungsi                                                         |
| :------------- | :------------------------------------------------------------- |
| `pnpm dev`     | Bangun JSON wilayah, lalu dev server `localhost:4321`          |
| `pnpm test`    | Test library + snippet JS/PHP/Python (PHP & Python opsional)   |
| `pnpm check`   | Type check                                                     |
| `pnpm build`   | Bangun JSON wilayah + build ke `dist/`                         |
| `pnpm preview` | Build + `wrangler dev` (cek `_headers`/CSP seperti production) |

## Perawatan data

| Data | File | Kapan | Sumber |
| :--- | :--- | :---- | :----- |
| Hari libur | `src/data/libur.ts` | Tambah blok tahun baru setelah SKB 3 Menteri terbit (biasanya September). Halaman `/hari-libur/{tahun}/`, JSON, dan .ics dibuat otomatis. | setneg.go.id |
| Kode wilayah | `data/wilayah.csv`, `data/meta.json` | Saat Kepmendagri kode wilayah baru terbit. Perbarui repo `data-wilayah`, lalu `make sync` di sana (menyalin CSV + meta ke sini setelah verifikasi lolos). Angka `expected` dibaca dari `meta.json`. | Lampiran Kepmendagri 300.2.2-2138/2025 jo. 300.2.2-2430/2025 (peraturan.bpk.go.id) |
| Prefix operator | `src/lib/phone.ts` | Kalau ada merger/prefix baru, atau MNP diberlakukan. | Situs operator |
| Snippet di halaman | `src/snippets/*` | Setiap ubah, jalankan `pnpm test` (snippet dites terhadap library). | - |

`public/api/wilayah/` dan `public/data/wilayah-nik.json` adalah hasil turunan (di-gitignore), dibuat ulang setiap `dev`/`build`.
