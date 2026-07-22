FROM python:3.12-slim

# ffmpeg dibutuhkan yt-dlp untuk gabung video + konversi MP3
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# yt-dlp nightly: memuat perbaikan ekstraktor TikTok terbaru
# (mis. error "Unable to extract universal data for rehydration")
RUN pip install --no-cache-dir --pre -U yt-dlp
COPY . .

EXPOSE 8000
# PENTING: 1 worker — state pagination infinite-scroll disimpan di memori proses.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
