import type { MediaItem, DownloadOption, Quality } from "./types";

const PRESET: Quality[] = [
  { label: "1080p", mode: "video", quality: 1080, ext: "mp4" },
  { label: "720p", mode: "video", quality: 720, ext: "mp4" },
  { label: "480p", mode: "video", quality: 480, ext: "mp4" },
  { label: "360p", mode: "video", quality: 360, ext: "mp4" },
  { label: "MP3 · Audio", mode: "audio", quality: "", ext: "mp3" },
];

/** Bangun daftar opsi unduhan dari item (pakai qualities backend; PRESET bila kosong). */
export function buildOptions(item: MediaItem): DownloadOption[] {
  const qs = item.qualities && item.qualities.length ? item.qualities : PRESET;
  return qs.map((q, i) => ({
    id: `${q.mode}-${q.quality || "best"}-${i}`,
    label: q.label,
    mode: q.mode,
    quality: q.quality,
    ext: q.ext,
    filesize: q.filesize,
  }));
}

/** URL unduhan yt-dlp (server memproses, lalu stream sebagai attachment). */
export function buildDownloadUrl(url: string, opt: DownloadOption): string {
  const p = new URLSearchParams({ url, mode: opt.mode });
  if (opt.mode === "video" && typeof opt.quality === "number") {
    p.set("quality", String(opt.quality));
  }
  return `/api/media/download?${p.toString()}`;
}

/** Proksi gambar via backend agar lolos CORP (thumbnail cover video IG hitam tanpa ini). */
export function proxyImg(u: string, filename = "thumb.jpg"): string {
  if (!u) return "";
  const p = new URLSearchParams({ url: u, filename, inline: "1" });
  return `/api/download?${p.toString()}`;
}

export function fmtDuration(s?: number | null): string {
  if (s == null || !isFinite(s)) return "";
  s = Math.round(s);
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, "0");
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = String(m % 60).padStart(2, "0");
    return `${h}:${mm}:${sec}`;
  }
  return `${m}:${sec}`;
}

export function fmtBytes(n?: number): string {
  if (!n || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function fmtCount(n?: number): string {
  if (n == null) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
