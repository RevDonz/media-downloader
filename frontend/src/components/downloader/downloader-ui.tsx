"use client";

import * as React from "react";
import {
  Link as LinkIcon,
  Loader2,
  Music,
  Video,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import type { MediaItem, DownloadOption } from "@/lib/types";
import {
  buildOptions,
  buildDownloadUrl,
  proxyImg,
  fmtDuration,
  fmtBytes,
} from "@/lib/media";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

// ---------------------------------------------------------------------------
// UrlBar
// ---------------------------------------------------------------------------

const EXAMPLES = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.tiktok.com/@tiktok/video/7106594312292453675",
];

export function UrlBar({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  loading: boolean;
}) {
  const disabled = loading || !value.trim();

  return (
    <div className="space-y-3">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim() || loading) return;
          onSubmit(value.trim());
        }}
      >
        <div className="relative flex-1">
          <LinkIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="Tempel link video apa saja — YouTube, TikTok, X, Facebook, Vimeo…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-12 pl-10 text-base"
          />
        </div>
        <Button
          type="submit"
          disabled={disabled}
          className="h-12 bg-primary px-6 text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Download className="size-5" />
              Ambil
            </>
          )}
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Contoh:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={loading}
            onClick={() => {
              onChange(ex);
              onSubmit(ex);
            }}
            className="max-w-[220px] truncate rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MediaPlayer
// ---------------------------------------------------------------------------

export function MediaPlayer({ item }: { item: MediaItem }) {
  const [buffering, setBuffering] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  return (
    <Card className="relative overflow-hidden bg-black p-0">
      <video
        key={`${item.url}-${reloadKey}`}
        src={item.play}
        poster={proxyImg(item.thumb)}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-black object-contain"
        onWaiting={() => setBuffering(true)}
        onPlaying={() => {
          setBuffering(false);
          setError(false);
        }}
        onLoadedData={() => setBuffering(false)}
        onError={() => {
          setBuffering(false);
          setError(true);
        }}
      />

      {buffering && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/50">
          <div className="flex flex-col items-center gap-2 text-white">
            <Loader2 className="size-8 animate-spin" />
            <span className="text-sm font-medium">Menyiapkan pemutar…</span>
            <span className="text-xs text-white/70">
              Server memproses resolusi, mohon tunggu.
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/70">
          <div className="flex flex-col items-center gap-3 text-white">
            <AlertCircle className="size-8 text-primary" />
            <span className="text-sm font-medium">Gagal memuat pemutar.</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setError(false);
                setBuffering(false);
                setReloadKey((k) => k + 1);
              }}
            >
              <RefreshCw className="size-4" />
              Muat ulang
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// MediaInfoCard
// ---------------------------------------------------------------------------

export function MediaInfoCard({ item }: { item: MediaItem }) {
  const dur = fmtDuration(item.duration);
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proxyImg(item.thumb)}
          alt=""
          className="h-20 w-32 flex-none rounded-md bg-muted object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className="capitalize bg-primary text-primary-foreground hover:bg-primary/90">
              {item.platform || "video"}
            </Badge>
            {dur && <Badge variant="secondary">{dur}</Badge>}
          </div>
          <CardTitle className="line-clamp-2 text-base leading-snug">
            {item.title}
          </CardTitle>
          {item.uploader && (
            <CardDescription className="line-clamp-1">
              {item.uploader}
            </CardDescription>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DownloadPanel
// ---------------------------------------------------------------------------

export function DownloadPanel({ item }: { item: MediaItem }) {
  const options = React.useMemo(() => buildOptions(item), [item]);
  const [selectedId, setSelectedId] = React.useState<string>(
    options[0]?.id ?? "",
  );

  React.useEffect(() => {
    setSelectedId(options[0]?.id ?? "");
  }, [options]);

  const selected: DownloadOption | undefined =
    options.find((o) => o.id === selectedId) ?? options[0];

  const handleDownload = () => {
    if (!selected) return;
    const href = buildDownloadUrl(item.url, selected);
    const id = toast.loading("Menyiapkan unduhan di server…", {
      description: "File diproses dulu, jangan tutup tab.",
    });
    const a = document.createElement("a");
    a.href = href;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Navigasi unduhan tak memberi sinyal selesai → ganti toast setelah jeda.
    setTimeout(() => {
      toast.success("Unduhan dimulai — cek folder Download.", { id });
    }, 3500);
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Pilih kualitas</h2>
          <p className="text-xs text-muted-foreground">
            Kualitas tertinggi dipilih otomatis.
          </p>
        </div>

        <RadioGroup value={selectedId} onValueChange={setSelectedId} className="gap-2">
          {options.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition hover:bg-accent has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5"
            >
              <RadioGroupItem value={opt.id} />
              {opt.mode === "audio" ? (
                <Music className="size-4 flex-none text-muted-foreground" />
              ) : (
                <Video className="size-4 flex-none text-muted-foreground" />
              )}
              <span className="flex-1 text-sm font-medium">{opt.label}</span>
              {opt.filesize ? (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {fmtBytes(opt.filesize)}
                </span>
              ) : null}
              <Badge variant="outline" className="uppercase">
                {opt.ext}
              </Badge>
            </label>
          ))}
        </RadioGroup>

        <Button
          onClick={handleDownload}
          disabled={!selected}
          className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Download className="size-4" />
          Unduh {selected?.label ?? ""}
        </Button>

        <div className="space-y-1.5">
          <Progress value={null} className="h-1" />
          <p className="text-[11px] leading-snug text-muted-foreground">
            Kualitas final dipilih server hingga resolusi terpilih.
          </p>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PlaylistCard
// ---------------------------------------------------------------------------

export function PlaylistCard({
  item,
  onOpen,
}: {
  item: MediaItem;
  onOpen: () => void;
}) {
  const dur = fmtDuration(item.duration);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left outline-none ring-ring transition hover:bg-accent focus-visible:ring-2 animate-fade-up"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proxyImg(item.thumb)}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition duration-300 group-hover:scale-105"
        />
        {dur && (
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
            {dur}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">
          {item.title}
        </p>
        {item.uploader && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {item.uploader}
          </p>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface py-20 text-center animate-fade-up">
      <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Download className="size-8" />
      </div>
      <p className="text-base font-medium text-muted-foreground">
        Tempel link video untuk mulai
      </p>
      <p className="max-w-sm text-sm text-muted-foreground/80">
        Dukung ratusan situs — YouTube, TikTok, X, Facebook, Vimeo, dan lainnya.
        Unduh video atau ekstrak audio (MP3).
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoaderSkeleton
// ---------------------------------------------------------------------------

export function LoaderSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Card className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-20 w-32 flex-none rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </Card>
      </div>
      <Card className="h-fit p-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </Card>
    </div>
  );
}
