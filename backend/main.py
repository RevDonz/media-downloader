"""
Media Downloader — backend FastAPI.

Instagram: instaloader (Post/Reels/Story/Highlight, login via cookie sessionid).
YouTube/TikTok: yt-dlp (info, streaming play dengan Range, unduh video/MP3).

Jalankan:  uvicorn main:app --reload --port 8000
Frontend Next.js mem-proxy /api/* ke server ini.
"""

import io
import mimetypes
import os
import re
import secrets
import shutil
import tempfile
import time
import zipfile
from urllib.parse import quote, unquote, urlparse

import instaloader
import requests
import yt_dlp
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel

app = FastAPI(title="Media Downloader API")

# Frontend memanggil lewat proxy Next (same-origin), tapi izinkan juga akses
# langsung ke backend saat pengembangan.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Domain CDN yang boleh diproksi untuk tampil/unduh (mencegah SSRF).
ALLOWED_CDN = (
    # Instagram / Facebook
    "cdninstagram.com", "fbcdn.net", "instagram.com",
    # YouTube / Google
    "ytimg.com", "googlevideo.com", "ggpht.com", "googleusercontent.com",
    # TikTok
    "tiktokcdn.com", "tiktokcdn-us.com", "ttwstatic.com",
    "ibyteimg.com", "muscdn.com", "byteoversea.com", "akamaized.net",
)

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


# --------------------------------------------------------------------------- #
# Helper Instagram (identik dengan versi Flask — framework-agnostic)           #
# --------------------------------------------------------------------------- #
def _clean_sessionid(raw):
    raw = (raw or "").strip().strip('"').strip("'")
    m = re.search(r"sessionid=([^;]+)", raw)
    if m:
        raw = m.group(1).strip()
    if "%" in raw:
        raw = unquote(raw)
    return raw.strip()


def _cookie_value(jar, name):
    val = None
    for c in jar:
        if c.name == name and c.value:
            val = c.value
    return val


def build_loader(sessionid=None):
    L = instaloader.Instaloader(
        download_pictures=True,
        download_videos=True,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        quiet=True,
        max_connection_attempts=1,
        request_timeout=30.0,
    )
    L.context._session.headers.update({
        "User-Agent": UA,
        "X-IG-App-ID": "936619743392459",
    })

    if sessionid:
        sessionid = _clean_sessionid(sessionid)
        L.context._session.cookies.set("sessionid", sessionid, domain=".instagram.com")
        uid = sessionid.split(":", 1)[0]
        if uid.isdigit():
            L.context._session.cookies.set("ds_user_id", uid, domain=".instagram.com")
        try:
            L.context._session.get("https://www.instagram.com/", timeout=15)
        except Exception:
            pass
        csrf = _cookie_value(L.context._session.cookies, "csrftoken")
        if csrf:
            L.context._session.headers.update({"X-CSRFToken": csrf})
        try:
            username = L.test_login()
            if username:
                L.context.username = username
        except Exception:
            pass
    return L


def parse_query(query):
    query = query.strip()
    if "instagram.com" in query:
        m = re.search(r"/(?:p|reel|reels|tv)/([A-Za-z0-9_-]+)", query)
        if m:
            return ("shortcode", m.group(1))
        m = re.search(r"/stories/([A-Za-z0-9_.]+)", query)
        if m:
            return ("username", m.group(1))
        m = re.search(r"instagram\.com/([A-Za-z0-9_.]+)", query)
        if m:
            return ("username", m.group(1))
    return ("username", query.lstrip("@"))


def _safe(name):
    return re.sub(r"[^\w.-]+", "_", str(name))


def media_entry(username, shortcode, index, mtype, url, thumb, caption, date_str):
    ext = "mp4" if mtype == "video" else "jpg"
    filename = f"{_safe(username)}_{_safe(shortcode)}_{index}.{ext}"
    thumb_out = thumb
    if mtype == "video" and thumb:
        thumb_out = f"/api/download?url={quote(thumb, safe='')}&filename=thumb.jpg&inline=1"
    return {
        "type": mtype,
        "thumb": thumb_out,
        "url": url,
        "filename": filename,
        "download": f"/api/download?url={quote(url, safe='')}&filename={quote(filename)}",
        "caption": (caption or "")[:220],
        "shortcode": shortcode,
        "date": date_str,
    }


def entries_from_post(post, username=None):
    username = username or post.owner_username
    sc = post.shortcode
    date_str = post.date_local.strftime("%Y-%m-%d") if post.date_local else ""
    caption = post.caption or ""
    out = []
    idx = 1
    if post.typename == "GraphSidecar":
        for node in post.get_sidecar_nodes():
            if node.is_video:
                out.append(media_entry(username, sc, idx, "video",
                                       node.video_url, node.display_url, caption, date_str))
            else:
                out.append(media_entry(username, sc, idx, "image",
                                       node.display_url, node.display_url, caption, date_str))
            idx += 1
    elif post.is_video:
        out.append(media_entry(username, sc, idx, "video", post.video_url, post.url, caption, date_str))
    else:
        out.append(media_entry(username, sc, idx, "image", post.url, post.url, caption, date_str))
    return out


def _host_ok(url):
    host = (urlparse(url).hostname or "").lower()
    return any(host == d or host.endswith("." + d) for d in ALLOWED_CDN)


# --------------------------------------------------------------------------- #
# Sesi penelusuran (infinite scroll)                                           #
# --------------------------------------------------------------------------- #
BROWSE = {}
BROWSE_TTL = 1800
PAGE = 9


def _purge_browse():
    now = time.time()
    for tok in [t for t, s in BROWSE.items() if now - s["ts"] > BROWSE_TTL]:
        BROWSE.pop(tok, None)


def _collect_page(posts_iter, n, username):
    posts_e, reels_e = [], []
    got = 0
    for post in posts_iter:
        try:
            entries = entries_from_post(post, username)
        except Exception:
            continue
        posts_e.extend(entries)
        if post.is_video and post.typename != "GraphSidecar":
            reels_e.extend(entries)
        got += 1
        if got >= n:
            break
    return posts_e, reels_e, got == n


def _fetch_stories(L, profile):
    out = []
    for story in L.get_stories([profile.userid]):
        for item in story.get_items():
            mtype = "video" if item.is_video else "image"
            url = item.video_url if item.is_video else item.url
            ds = item.date_local.strftime("%Y-%m-%d %H:%M %Z") if item.date_local else ""
            out.append(media_entry(profile.username, f"story_{item.mediaid}",
                                   1, mtype, url, item.url, "", ds))
    return out


def _fetch_highlights(L, profile):
    out = []
    for h in L.get_highlights(profile):
        title = _safe(h.title or "highlight")
        for item in h.get_items():
            mtype = "video" if item.is_video else "image"
            url = item.video_url if item.is_video else item.url
            ds = item.date_local.strftime("%Y-%m-%d") if item.date_local else ""
            out.append(media_entry(profile.username, f"{title}_{item.mediaid}",
                                   1, mtype, url, item.url, h.title, ds))
    return out


class ResolveError(Exception):
    def __init__(self, message, code=502):
        super().__init__(message)
        self.code = code


def _web_profile_info(L, username, mobile=False):
    if mobile:
        try:
            data = L.context.get_iphone_json(
                path="api/v1/users/web_profile_info/", params={"username": username}
            )
        except instaloader.exceptions.ConnectionException as e:
            if "429" in str(e):
                raise ResolveError("RL", 429)
            return None
        return (data.get("data") or {}).get("user") if data else None

    r = L.context._session.get(
        "https://www.instagram.com/api/v1/users/web_profile_info/",
        params={"username": username},
        headers={"Referer": f"https://www.instagram.com/{username}/",
                 "X-IG-App-ID": "936619743392459"},
        timeout=20,
    )
    if r.status_code == 429:
        raise ResolveError("RL", 429)
    if r.status_code == 404:
        return None
    if r.status_code != 200:
        return None
    try:
        return (r.json().get("data") or {}).get("user")
    except ValueError:
        return None


def resolve_profile(L, username):
    try:
        return instaloader.Profile.from_username(L.context, username)
    except instaloader.exceptions.ProfileNotExistsException:
        pass

    node, rate_limited = None, False
    for mobile in (False, True):
        try:
            node = _web_profile_info(L, username, mobile=mobile)
            if node:
                break
        except ResolveError:
            rate_limited = True
        except Exception:
            pass

    if node:
        return instaloader.Profile(L.context, node)
    if rate_limited:
        raise ResolveError(
            f'Akun "{username}" tersembunyi dari pencarian Instagram. '
            "SOLUSI: buka profilnya di browser, salin link salah satu POST atau REEL-nya, "
            "lalu tempel link itu di sini — tool akan memuat SELURUH akun dari link tersebut. "
            "(Pencarian via username sedang dibatasi Instagram/429.)",
            429,
        )
    raise instaloader.exceptions.ProfileNotExistsException(f"Profil {username} tidak ada.")


def _shortcode_to_mediaid(shortcode):
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    mid = 0
    for ch in shortcode:
        if ch not in alphabet:
            break
        mid = mid * 64 + alphabet.index(ch)
    return mid


def profile_from_shortcode(L, shortcode):
    mediaid = _shortcode_to_mediaid(shortcode)
    try:
        data = L.context.get_iphone_json(path=f"api/v1/media/{mediaid}/info/", params={})
    except instaloader.exceptions.TooManyRequestsException:
        raise
    except Exception as e:
        raise ResolveError(f"Gagal membaca post dari link ini (coba login / cek link): {e}", 502)
    items = (data or {}).get("items") or []
    if not items:
        raise ResolveError("Post pada link ini tidak ditemukan / tidak bisa diakses.", 404)
    owner = items[0].get("user") or {}
    pk = owner.get("pk") or owner.get("id")
    if not pk:
        raise ResolveError("Tidak bisa menentukan pemilik post dari link ini.", 502)
    return instaloader.Profile(L.context, {"id": str(pk), "username": owner.get("username") or ""})


# --------------------------------------------------------------------------- #
# Model request                                                                #
# --------------------------------------------------------------------------- #
class FetchBody(BaseModel):
    query: str = ""
    sessionid: str = ""


class TokenBody(BaseModel):
    token: str = ""


class SessionBody(BaseModel):
    sessionid: str = ""


class InfoBody(BaseModel):
    url: str = ""


class ZipItem(BaseModel):
    url: str = ""
    filename: str = "media"


class ZipBody(BaseModel):
    items: list[ZipItem] = []


# --------------------------------------------------------------------------- #
# Endpoint Instagram                                                           #
# --------------------------------------------------------------------------- #
@app.post("/api/login-check")
def login_check(body: SessionBody):
    sessionid = (body.sessionid or "").strip()
    if not sessionid:
        return {"ok": False, "error": "sessionid kosong"}
    L = build_loader(sessionid)
    if L.context.username:
        return {"ok": True, "username": L.context.username}
    return {"ok": False, "error": "sessionid tidak valid atau kadaluarsa"}


@app.post("/api/fetch")
def fetch(body: FetchBody):
    _purge_browse()
    query = (body.query or "").strip()
    sessionid = body.sessionid or ""
    if not query:
        return JSONResponse({"error": "Masukkan username atau link Instagram."}, status_code=400)

    L = build_loader(sessionid)
    logged_in = bool(L.context.username)
    kind, value = parse_query(query)

    try:
        if kind == "shortcode":
            profile = profile_from_shortcode(L, value)
            _ = profile.mediacount
        else:
            profile = resolve_profile(L, value)

        posts_iter = profile.get_posts()
        posts_e, reels_e, has_more = _collect_page(posts_iter, PAGE, profile.username)

        token = secrets.token_hex(8)
        BROWSE[token] = {
            "L": L, "profile": profile, "iter": posts_iter,
            "logged_in": logged_in, "ts": time.time(),
        }

        warnings = []
        if not logged_in:
            warnings.append("Belum login — Story & Highlight tidak tersedia. Buka menu Cookie untuk login.")

        return {
            "single": False,
            "logged_in": logged_in,
            "token": token,
            "has_more": has_more,
            "profile": {
                "username": profile.username,
                "full_name": profile.full_name,
                "userid": profile.userid,
                "is_private": profile.is_private,
                "is_verified": profile.is_verified,
                "followers": profile.followers,
                "following": profile.followees,
                "posts_count": profile.mediacount,
                "profile_pic": profile.profile_pic_url,
                "biography": profile.biography,
            },
            "media": {"posts": posts_e, "reels": reels_e, "stories": [], "highlights": []},
            "warnings": warnings,
        }

    except ResolveError as e:
        return JSONResponse({"error": str(e)}, status_code=e.code)
    except instaloader.exceptions.ProfileNotExistsException:
        if not logged_in:
            return JSONResponse({"error": f'Akun "{value}" tidak ditemukan — atau Instagram memblokir akses tanpa login. Masukkan cookie sessionid lalu coba lagi.'}, status_code=404)
        return JSONResponse({"error": f'Akun "{value}" tidak ditemukan. Kemungkinan: salah ketik, akun dihapus/nonaktif, atau tersembunyi dari pencarian. SOLUSI: tempel link salah satu POST/REEL akun itu — tool akan memuat seluruh akunnya dari link tersebut.'}, status_code=404)
    except instaloader.exceptions.PrivateProfileNotFollowedException:
        return JSONResponse({"error": "Akun ini private. Login dengan akun yang mengikutinya (masukkan cookie)."}, status_code=403)
    except instaloader.exceptions.LoginRequiredException:
        return JSONResponse({"error": "Instagram meminta login. Masukkan cookie sessionid dari browser yang sudah login."}, status_code=401)
    except instaloader.exceptions.TooManyRequestsException:
        return JSONResponse({"error": "Instagram membatasi permintaan (rate limit / 429). Tunggu 5–15 menit, gunakan cookie akun yang sudah login."}, status_code=429)
    except instaloader.exceptions.BadResponseException as e:
        return JSONResponse({"error": f"Instagram menolak/membatasi permintaan sementara ({e}). Biasanya efek rate-limit — tunggu 10–15 menit lalu coba lagi."}, status_code=502)
    except instaloader.exceptions.ConnectionException as e:
        if sessionid and not logged_in:
            return JSONResponse({"error": "Cookie sessionid tidak berhasil login (kemungkinan salah salin, kadaluarsa, atau ditolak Instagram). Klik 'Cek Login' dulu sampai berhasil, baru cari media."}, status_code=401)
        return JSONResponse({"error": f"Koneksi gagal / diblokir Instagram: {e}"}, status_code=502)
    except Exception as e:
        return JSONResponse({"error": f"Terjadi kesalahan: {e}"}, status_code=500)


@app.post("/api/more")
def more(body: TokenBody):
    token = body.token or ""
    sess = BROWSE.get(token)
    if not sess:
        return JSONResponse(
            {"error": "Sesi kedaluwarsa, silakan cari ulang.", "posts": [], "reels": [], "has_more": False},
            status_code=410,
        )
    sess["ts"] = time.time()
    try:
        posts_e, reels_e, has_more = _collect_page(sess["iter"], PAGE, sess["profile"].username)
        return {"posts": posts_e, "reels": reels_e, "has_more": has_more}
    except instaloader.exceptions.TooManyRequestsException:
        return JSONResponse(
            {"error": "Instagram membatasi permintaan (rate limit). Tunggu beberapa menit.", "posts": [], "reels": [], "has_more": False},
            status_code=429,
        )
    except Exception as e:
        return JSONResponse(
            {"error": f"Gagal memuat lagi: {e}", "posts": [], "reels": [], "has_more": False},
            status_code=500,
        )


@app.post("/api/extra")
def extra(body: TokenBody):
    token = body.token or ""
    sess = BROWSE.get(token)
    if not sess:
        return JSONResponse({"stories": [], "highlights": [], "warnings": ["Sesi kedaluwarsa."]}, status_code=410)
    sess["ts"] = time.time()
    if not sess["logged_in"]:
        return {"stories": [], "highlights": [], "warnings": ["Story & Highlight butuh login. Buka menu Cookie."]}
    L, profile = sess["L"], sess["profile"]
    warnings, stories, highlights = [], [], []
    try:
        stories = _fetch_stories(L, profile)
    except instaloader.exceptions.TooManyRequestsException:
        warnings.append("Story dilewati: Instagram rate-limit.")
    except Exception as e:
        warnings.append(f"Story gagal: {e}")
    try:
        highlights = _fetch_highlights(L, profile)
    except instaloader.exceptions.TooManyRequestsException:
        warnings.append("Highlight dilewati: Instagram rate-limit.")
    except Exception as e:
        warnings.append(f"Highlight gagal: {e}")
    return {"stories": stories, "highlights": highlights, "warnings": warnings}


@app.get("/api/download")
def download(url: str = "", filename: str = "instagram_media", inline: str | None = None):
    if not url:
        return Response("missing url", status_code=400)
    if not _host_ok(url):
        return Response("domain tidak diizinkan", status_code=403)

    upstream = requests.get(url, stream=True, headers={"User-Agent": UA}, timeout=30)
    if upstream.status_code != 200:
        return Response(f"gagal mengambil media ({upstream.status_code})", status_code=502)

    def generate():
        for chunk in upstream.iter_content(8192):
            if chunk:
                yield chunk

    ctype = upstream.headers.get("Content-Type", "application/octet-stream")
    disposition = "inline" if inline else f'attachment; filename="{filename}"'
    headers = {"Content-Disposition": disposition}
    if inline:
        headers["Cache-Control"] = "public, max-age=3600"
    return StreamingResponse(generate(), media_type=ctype, headers=headers)


@app.post("/api/download-zip")
def download_zip(body: ZipBody):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as zf:
        seen = {}
        for it in body.items:
            url, name = it.url, it.filename or "media"
            if not url or not _host_ok(url):
                continue
            n = seen.get(name, 0)
            seen[name] = n + 1
            if n:
                stem, _, ext = name.rpartition(".")
                name = f"{stem}_{n}.{ext}" if stem else f"{name}_{n}"
            try:
                r = requests.get(url, headers={"User-Agent": UA}, timeout=30)
                if r.status_code == 200:
                    zf.writestr(name, r.content)
            except Exception:
                continue
    buf.seek(0)
    return Response(
        content=buf.read(),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="instagram_media.zip"'},
    )


# --------------------------------------------------------------------------- #
# YouTube / TikTok (yt-dlp)                                                    #
# --------------------------------------------------------------------------- #
YTDLP_HOSTS = (
    "youtube.com", "youtu.be", "youtube-nocookie.com",
    "tiktok.com", "vt.tiktok.com", "vm.tiktok.com",
)


def detect_platform(query):
    q = (query or "").lower()
    if "tiktok.com" in q:
        return "tiktok"
    if "youtube.com" in q or "youtu.be" in q:
        return "youtube"
    return "instagram"


def _ytdlp_host_ok(url):
    host = (urlparse(url).hostname or "").lower()
    return any(host == d or host.endswith("." + d) for d in YTDLP_HOSTS)


def _is_collection(url):
    u = url.lower()
    if "youtube.com/playlist" in u:
        return True
    if "youtube.com/channel/" in u or "youtube.com/c/" in u:
        return True
    if re.search(r"youtube\.com/@[^/]+/?(\?|$)", u):
        return True
    if "tiktok.com/@" in u and "/video/" not in u and "/photo/" not in u:
        return True
    return False


def _entry_thumb(e):
    if e.get("thumbnail"):
        return e["thumbnail"]
    ths = e.get("thumbnails") or []
    return ths[-1]["url"] if ths else ""


def _media_item(e, platform):
    wp = e.get("webpage_url") or e.get("url") or ""
    return {
        "title": e.get("title") or "(tanpa judul)",
        "uploader": e.get("uploader") or e.get("channel") or e.get("uploader_id") or "",
        "duration": e.get("duration"),
        "thumb": _entry_thumb(e),
        "url": wp,
        "play": f"/api/media/play?url={quote(wp, safe='')}" if wp else "",
        "platform": platform,
    }


def _qualities_from_info(info):
    heights = sorted(
        {f.get("height") for f in (info.get("formats") or []) if f.get("height")},
        reverse=True,
    )
    out = []
    if heights:
        maxh = heights[0]
        tiers = [2160, 1440, 1080, 720, 480, 360, 240]
        chosen = [h for h in tiers if h <= maxh]
        if not chosen:
            chosen = [maxh]
        for h in chosen:
            label = {2160: "4K", 1440: "2K"}.get(h, f"{h}p")
            out.append({"label": label, "mode": "video", "quality": h, "ext": "mp4"})
    else:
        out.append({"label": "Video terbaik", "mode": "video", "quality": "", "ext": "mp4"})
    out.append({"label": "MP3 · Audio", "mode": "audio", "quality": "", "ext": "mp3"})
    return out


@app.post("/api/media/info")
def media_info(body: InfoBody):
    url = (body.url or "").strip()
    if not _ytdlp_host_ok(url):
        return JSONResponse({"error": "Hanya URL YouTube atau TikTok yang didukung."}, status_code=400)
    platform = detect_platform(url)
    opts = {"quiet": True, "no_warnings": True, "skip_download": True, "socket_timeout": 30}
    if _is_collection(url):
        opts["extract_flat"] = "in_playlist"
    else:
        opts["noplaylist"] = True
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        return JSONResponse({"error": f"Gagal membaca media: {e}"}, status_code=502)

    if info.get("_type") == "playlist" or "entries" in info:
        items = [_media_item(e, platform) for e in (info.get("entries") or []) if e]
        return {"type": "list", "platform": platform, "title": info.get("title") or "", "items": items}
    item = _media_item(info, platform)
    item["qualities"] = _qualities_from_info(info)
    return {"type": "single", "platform": platform, "item": item}


_PLAY_CACHE = {}
_PLAY_TTL = 240


def _resolve_play(url):
    now = time.time()
    hit = _PLAY_CACHE.get(url)
    if hit and now - hit[2] < _PLAY_TTL:
        return hit[0], hit[1]
    opts = {
        "quiet": True, "no_warnings": True, "noplaylist": True, "skip_download": True,
        "socket_timeout": 30,
        "format": "best[ext=mp4][vcodec!=none][acodec!=none]/best[vcodec!=none][acodec!=none]/best",
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    if info.get("_type") == "playlist":
        entries = [e for e in (info.get("entries") or []) if e]
        info = entries[0] if entries else {}
    direct = info.get("url")
    headers = info.get("http_headers") or {}
    _PLAY_CACHE[url] = (direct, headers, now)
    if len(_PLAY_CACHE) > 200:
        for k in list(_PLAY_CACHE)[:100]:
            _PLAY_CACHE.pop(k, None)
    return direct, headers


# ---- TikTok: URL CDN terikat sesi (403 bila diproxy) → unduh (cache) lalu sajikan ----
_TT_FILE_CACHE = {}   # url -> (path, tmpdir, ts)
_TT_TTL = 600


def _tiktok_file(url):
    now = time.time()
    hit = _TT_FILE_CACHE.get(url)
    if hit and now - hit[2] < _TT_TTL and os.path.exists(hit[0]):
        return hit[0]
    tmp = tempfile.mkdtemp(prefix="ttplay_")
    opts = {
        "quiet": True, "no_warnings": True, "noplaylist": True, "socket_timeout": 30,
        "format": "best[ext=mp4]/mp4/best",
        "outtmpl": os.path.join(tmp, "v.%(ext)s"),
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.extract_info(url, download=True)
    files = [f for f in os.listdir(tmp) if not f.endswith(".part")]
    if not files:
        shutil.rmtree(tmp, ignore_errors=True)
        raise RuntimeError("tidak ada file terunduh")
    path = os.path.join(tmp, files[0])
    _TT_FILE_CACHE[url] = (path, tmp, now)
    for k, (_p, d, t) in list(_TT_FILE_CACHE.items()):
        if now - t > _TT_TTL:
            shutil.rmtree(d, ignore_errors=True)
            _TT_FILE_CACHE.pop(k, None)
    return path


def _serve_file_range(path, request):
    size = os.path.getsize(path)
    ctype = mimetypes.guess_type(path)[0] or "video/mp4"
    m = re.match(r"bytes=(\d+)-(\d*)", request.headers.get("range") or "")
    if m:
        start = int(m.group(1))
        end = int(m.group(2)) if m.group(2) else size - 1
        end = min(end, size - 1)
        length = end - start + 1

        def gen():
            with open(path, "rb") as f:
                f.seek(start)
                left = length
                while left > 0:
                    chunk = f.read(min(65536, left))
                    if not chunk:
                        break
                    left -= len(chunk)
                    yield chunk

        return StreamingResponse(
            gen(), status_code=206, media_type=ctype,
            headers={
                "Content-Range": f"bytes {start}-{end}/{size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(length),
            },
        )

    def gen_all():
        with open(path, "rb") as f:
            while True:
                chunk = f.read(65536)
                if not chunk:
                    break
                yield chunk

    return StreamingResponse(
        gen_all(), media_type=ctype,
        headers={"Accept-Ranges": "bytes", "Content-Length": str(size)},
    )


@app.get("/api/media/play")
def media_play(request: Request, url: str = ""):
    if not _ytdlp_host_ok(url):
        return Response("URL tidak diizinkan", status_code=403)
    # TikTok: CDN terikat sesi → unduh dulu (cache), lalu sajikan dari file.
    if "tiktok.com" in url.lower():
        try:
            path = _tiktok_file(url)
        except Exception as e:
            return Response(f"gagal memuat video TikTok: {e}", status_code=502)
        return _serve_file_range(path, request)
    try:
        direct, hdrs = _resolve_play(url)
    except Exception as e:
        return Response(f"gagal resolusi video: {e}", status_code=502)
    if not direct:
        return Response("tidak ada stream yang bisa diputar", status_code=502)

    # Teruskan SEMUA header yang diminta yt-dlp (TikTok butuh Referer/Accept/
    # Sec-Fetch-*; kalau tidak lengkap, CDN membalas 403).
    fwd = dict(hdrs) if hdrs else {}
    fwd.setdefault("User-Agent", UA)
    rng = request.headers.get("range")
    if rng:
        fwd["Range"] = rng

    upstream = requests.get(direct, headers=fwd, stream=True, timeout=30)
    passthru = {}
    for h in ("Content-Range", "Content-Length", "Accept-Ranges"):
        if h in upstream.headers:
            passthru[h] = upstream.headers[h]
    passthru.setdefault("Accept-Ranges", "bytes")
    media_type = upstream.headers.get("Content-Type", "video/mp4")
    return StreamingResponse(
        upstream.iter_content(65536),
        status_code=upstream.status_code,
        headers=passthru,
        media_type=media_type,
    )


@app.get("/api/media/download")
def media_download(url: str = "", mode: str = "video", quality: str = ""):
    if not _ytdlp_host_ok(url):
        return Response("URL tidak diizinkan", status_code=403)

    tmp = tempfile.mkdtemp(prefix="dl_")
    outtmpl = os.path.join(tmp, "%(title).100B.%(ext)s")
    if mode == "audio":
        opts = {
            "quiet": True, "no_warnings": True, "noplaylist": True,
            "restrictfilenames": True, "socket_timeout": 30,
            "format": "bestaudio/best", "outtmpl": outtmpl,
            "postprocessors": [{"key": "FFmpegExtractAudio",
                                "preferredcodec": "mp3", "preferredquality": "192"}],
        }
    else:
        if quality.isdigit():
            h = int(quality)
            fmt = f"bestvideo[height<={h}]+bestaudio/best[height<={h}]/best[height<={h}]/best"
        else:
            fmt = "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"
        opts = {
            "quiet": True, "no_warnings": True, "noplaylist": True,
            "restrictfilenames": True, "socket_timeout": 30,
            "format": fmt, "merge_output_format": "mp4", "outtmpl": outtmpl,
        }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.extract_info(url, download=True)
    except Exception as e:
        shutil.rmtree(tmp, ignore_errors=True)
        return Response(f"gagal mengunduh: {e}", status_code=502)

    files = [f for f in os.listdir(tmp) if not f.endswith(".part")]
    if not files:
        shutil.rmtree(tmp, ignore_errors=True)
        return Response("tidak ada file terunduh", status_code=502)
    path = os.path.join(tmp, files[0])
    fname = files[0]
    ctype = mimetypes.guess_type(fname)[0] or "application/octet-stream"

    def generate():
        try:
            with open(path, "rb") as f:
                while True:
                    chunk = f.read(65536)
                    if not chunk:
                        break
                    yield chunk
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    return StreamingResponse(
        generate(),
        media_type=ctype,
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


@app.get("/api/health")
def health():
    return {"ok": True}
