# Media Downloader — Web (Next.js)

Frontend modern (Next.js 16 · React 19 · Tailwind v4 · shadcn/ui) untuk downloader
YouTube / Instagram / TikTok. Semua `/api/*` di-proxy ke backend Flask (instaloader +
yt-dlp) di `../app.py` lewat `next.config.ts` rewrites.

## Menjalankan (satu perintah)

Dari folder `web/`:

```bash
npm install          # sekali saja
npm run dev:full     # menjalankan Flask (port 5000) + Next.js (port 3000) sekaligus
```

Buka **http://localhost:3000**.

> Butuh Python venv di `../.venv` (sudah ada) dan `ffmpeg` terpasang untuk YouTube/TikTok.

### Menjalankan terpisah

```bash
# terminal 1 — backend
cd .. && ./.venv/bin/python app.py

# terminal 2 — frontend
npm run dev
```

## Struktur

```
src/
  app/
    page.tsx                     # Landing
    (downloader)/
      layout.tsx                 # Nav + shell
      youtube/  instagram/  tiktok/   # 3 halaman downloader
  components/
    site? (inline)  nav/  youtube/  instagram/  media/  ui/(shadcn)
  hooks/     # useMediaFetch, useTiktokFetch, useInfiniteScroll, useSessionId, useModalNav
  lib/       # api.ts (client), media.ts (helpers), types.ts
```

Halaman: `/` (landing) · `/youtube` (utama) · `/instagram` · `/tiktok`.
Semua API tetap di backend Flask — lihat `../README.md`.
