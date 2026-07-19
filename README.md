# Media Downloader

Unduh media dari **YouTube**, **Instagram**, dan **TikTok** — video (pilih kualitas
1080p/720p/… sampai 4K), audio (MP3), foto, Reels, Story, dan Highlight. UI modern
dengan pratinjau/putar sebelum unduh, infinite scroll, dan modal galeri (zoom + play).

**Monorepo:**

```
media-downloader/
├── frontend/    Next.js 16 · React 19 · Tailwind v4 · shadcn/ui
├── backend/     FastAPI · instaloader (Instagram) · yt-dlp (YouTube/TikTok)
├── nginx/       reverse proxy (dipakai docker-compose)
├── deploy/      panduan deploy VPS (Docker & systemd)
└── docker-compose.yml
```

- **Frontend** hanya UI; semua `/api/*` diproxy ke **backend**.
- **Backend** mengerjakan pengunduhan (instaloader untuk Instagram, yt-dlp untuk
  YouTube/TikTok) + streaming video (Range/seek) + proksi thumbnail.

---

## Menjalankan (lokal)

Butuh **Node 20+**, **Python 3.10+**, dan **ffmpeg**.

### Backend (terminal 1)
```bash
cd backend
python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt   # atau: uv venv && uv pip install -r requirements.txt
./.venv/bin/uvicorn main:app --reload --port 8000
```
Docs API otomatis: http://127.0.0.1:8000/docs

### Frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Buka **http://localhost:3000**. Frontend mem-proxy `/api/*` → `http://127.0.0.1:8000`.

> Praktis: dari `frontend/`, `npm run dev:full` menjalankan backend (uvicorn) + frontend
> sekaligus (asumsi `backend/` ada di sampingnya).

---

## Deploy ke VPS

Paling cepat:
```bash
docker compose up -d --build
```
Detail lengkap (Docker & manual/systemd + SSL + catatan penting) → [`deploy/README.md`](deploy/README.md).

---

## Fitur

- **YouTube**: tempel link → media player + pilih kualitas video atau MP3. Mendukung playlist.
- **Instagram**: cari via username atau link. Kartu profil, tab Post/Reels/Story/Highlight,
  infinite scroll, modal (zoom foto / play video). Story/Highlight & akun private butuh
  cookie `sessionid`. Akun tersembunyi dari search bisa diambil lewat link post.
- **TikTok**: link video/profil → grid vertikal, putar & unduh (tanpa watermark).

## Catatan

Untuk penggunaan pribadi/edukatif. Hormati hak cipta & Ketentuan Layanan tiap platform.
Instagram membatasi akses otomatis secara agresif (rate limit) — terutama dari IP datacenter.
