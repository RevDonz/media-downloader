// ============================================================================
// Tipe respons API backend (Flask) — dipetakan persis dari app.py
// ============================================================================

// Downloader umum: backend bisa mengembalikan nama situs apa pun (vimeo, twitter, dll).
// Union di bawah hanya untuk autocomplete; `(string & {})` mengizinkan string bebas.
export type Platform = "youtube" | "tiktok" | "instagram" | (string & {});
export type QualityMode = "video" | "audio";

// ---- YouTube / TikTok (/api/media/*) ----
export interface Quality {
  label: string; // "1080p" | "720p" | "Video terbaik" | "MP3 · Audio"
  mode: QualityMode;
  quality: number | ""; // tinggi (height) atau "" untuk terbaik/audio
  ext: string; // "mp4" | "mp3"
  filesize?: number;
}

export interface MediaItem {
  title: string;
  uploader: string;
  duration: number | null;
  thumb: string;
  url: string; // webpage url
  play: string; // sudah berupa "/api/media/play?url=<encoded>"
  platform?: Platform;
  qualities?: Quality[]; // ada pada single; item list bisa tanpa ini
}

export interface MediaInfoSingle {
  type: "single";
  platform: Platform;
  item: MediaItem;
}
export interface MediaInfoList {
  type: "list";
  platform: Platform;
  title: string;
  items: MediaItem[];
}
export type MediaInfoResponse = MediaInfoSingle | MediaInfoList;

// Opsi unduhan yang dibangun UI (dari qualities)
export interface DownloadOption {
  id: string;
  label: string;
  mode: QualityMode;
  quality: number | "";
  ext: string;
  filesize?: number;
}

// ---- Instagram (/api/fetch, /api/more, /api/extra, /api/login-check) ----
export interface IgMedia {
  type: "image" | "video";
  thumb: string;
  url: string;
  filename: string;
  download: string;
  caption: string;
  shortcode: string;
  date: string;
}
export interface IgProfile {
  username: string;
  full_name: string;
  userid?: string | number;
  is_private: boolean;
  is_verified: boolean;
  followers: number;
  following: number;
  posts_count: number;
  profile_pic: string;
  biography: string;
  single_post?: boolean;
}
export type IgTab = "posts" | "reels" | "stories" | "highlights";
export interface IgMediaBuckets {
  posts: IgMedia[];
  reels: IgMedia[];
  stories: IgMedia[];
  highlights: IgMedia[];
}
export interface FetchResponse {
  single: boolean;
  logged_in: boolean;
  token: string | null;
  has_more: boolean;
  profile: IgProfile;
  media: IgMediaBuckets;
  warnings: string[];
}
export interface MoreResponse {
  posts: IgMedia[];
  reels: IgMedia[];
  has_more: boolean;
  error?: string;
}
export interface ExtraResponse {
  stories: IgMedia[];
  highlights: IgMedia[];
  warnings: string[];
}
export interface LoginCheckResponse {
  ok: boolean;
  username?: string;
  error?: string;
}
