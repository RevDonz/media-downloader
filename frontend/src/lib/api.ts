import type {
  MediaInfoResponse,
  FetchResponse,
  MoreResponse,
  ExtraResponse,
  LoginCheckResponse,
} from "./types";

async function postJson<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-json */
  }
  // Hanya HTTP non-2xx yang dianggap gagal. Respons 200 seperti login-check
  // {ok:false,error} / extra {warnings} tetap sampai ke pemanggil.
  if (!res.ok) {
    const msg =
      (data as { error?: string })?.error || `Permintaan gagal (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

// ---- YouTube / TikTok ----
export function fetchMediaInfo(url: string, signal?: AbortSignal) {
  return postJson<MediaInfoResponse>("/api/media/info", { url }, signal);
}

// ---- Instagram ----
export function igFetch(query: string, sessionid: string, signal?: AbortSignal) {
  return postJson<FetchResponse>("/api/fetch", { query, sessionid }, signal);
}
export function igMore(token: string, signal?: AbortSignal) {
  return postJson<MoreResponse>("/api/more", { token }, signal);
}
export function igExtra(token: string, signal?: AbortSignal) {
  return postJson<ExtraResponse>("/api/extra", { token }, signal);
}
export function igLoginCheck(sessionid: string, signal?: AbortSignal) {
  return postJson<LoginCheckResponse>("/api/login-check", { sessionid }, signal);
}
