# Deploy ke VPS

Dua cara: **Docker (paling gampang)** atau **manual (systemd + nginx)**.

---

## ⚠️ Baca dulu (khusus app ini)

1. **Instagram membenci IP datacenter.** instaloader/yt-dlp dari IP VPS lebih sering
   kena `403/429` dari Instagram. YouTube/TikTok relatif aman. Kalau butuh IG mulus,
   gunakan proxy residential.
2. **Backend WAJIB 1 worker.** State pagination infinite-scroll disimpan di memori
   (`BROWSE`). Jangan pakai gunicorn multi-worker — pakai `uvicorn --workers 1`
   (sudah diset di Dockerfile). Kalau mau skala, pindahkan state ke Redis.
3. Perlu **ffmpeg** di server (Docker image sudah menyertakannya).

---

## Cara 1 — Docker (disarankan)

Di VPS (sudah ada Docker + Docker Compose):

```bash
git clone https://github.com/RevDonz/media-downloader.git
cd media-downloader
docker compose up -d --build
```

Buka `http://IP_VPS`. nginx meneruskan `/api/*` → FastAPI dan sisanya → Next.js.

### HTTPS
Termudah pakai **Caddy** (SSL otomatis) sebagai pengganti service nginx, atau pasang
`certbot` di host dan terminasi TLS di depan compose. Atau taruh Cloudflare di depan.

Update:
```bash
git pull && docker compose up -d --build
```

---

## Cara 2 — Manual (systemd + nginx)

### Prasyarat
```bash
sudo apt update && sudo apt install -y python3-venv python3-pip nodejs npm nginx ffmpeg
# pastikan Node 20+ (pakai nvm bila perlu)
```

### Backend (FastAPI)
```bash
cd /opt/media-downloader/backend
python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt
```
`/etc/systemd/system/md-backend.service`:
```ini
[Unit]
Description=Media Downloader API (FastAPI)
After=network.target

[Service]
WorkingDirectory=/opt/media-downloader/backend
ExecStart=/opt/media-downloader/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

### Frontend (Next.js)
```bash
cd /opt/media-downloader/frontend
npm ci && npm run build
```
`/etc/systemd/system/md-frontend.service`:
```ini
[Unit]
Description=Media Downloader UI (Next.js)
After=network.target

[Service]
WorkingDirectory=/opt/media-downloader/frontend
ExecStart=/usr/bin/npm run start
Environment=NODE_ENV=production
Environment=PORT=3000
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now md-backend md-frontend
```

### nginx
Pakai `../nginx/default.conf` sebagai acuan, tapi ganti nama host `backend`/`frontend`
menjadi `127.0.0.1`:
```nginx
location /api/ { proxy_pass http://127.0.0.1:8000; proxy_buffering off; proxy_read_timeout 3600s; }
location /     { proxy_pass http://127.0.0.1:3000; }
```
Taruh di `/etc/nginx/sites-available/media-downloader`, `ln -s` ke `sites-enabled`,
`sudo nginx -t && sudo systemctl reload nginx`. Tambah SSL via `certbot --nginx`.
