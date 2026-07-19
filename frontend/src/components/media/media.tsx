"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useModalNav } from "@/hooks/useModalNav";

// ---------------------------------------------------------------------------
// Grid + Card
// ---------------------------------------------------------------------------
export function Grid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const MediaCard = React.memo(function MediaCard({
  thumb,
  isVideo,
  badge,
  square = true,
  onClick,
}: {
  thumb: string;
  isVideo?: boolean;
  badge?: string;
  square?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-muted outline-none ring-ring transition focus-visible:ring-2 animate-fade-up",
        square ? "aspect-square" : "aspect-[9/16]",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-full object-cover transition duration-300 group-hover:scale-105"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.opacity = "0";
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100" />
      {isVideo && (
        <span className="pointer-events-none absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/60 text-white backdrop-blur">
          <Play className="size-3 fill-current" />
        </span>
      )}
      {badge && (
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
          {badge}
        </span>
      )}
    </button>
  );
});

export function GridSkeleton({
  count = 10,
  square = true,
}: {
  count?: number;
  square?: boolean;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("w-full rounded-xl", square ? "aspect-square" : "aspect-[9/16]")}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Lightbox modal (custom portal — full control over dark backdrop + zoom)
// ---------------------------------------------------------------------------
export interface ModalMedia {
  kind: "image" | "video";
  imageSrc?: string;
  videoSrc?: string;
  poster?: string;
  downloadHref?: string;
  title?: string;
  caption?: string;
}

export function MediaModal({
  open,
  items,
  index,
  onIndexChange,
  onClose,
}: {
  open: boolean;
  items: ModalMedia[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  useModalNav({ open, length: items.length, index, setIndex: onIndexChange });

  // Esc + body scroll lock
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;
  const item = items[index];
  if (!item) return null;
  const many = items.length > 1;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-scale-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute right-3 top-3 z-20 text-white hover:bg-white/15 hover:text-white"
      >
        <X className="size-5" />
      </Button>

      {/* Prev / Next */}
      {many && (
        <>
          <Button
            variant="ghost"
            size="icon-lg"
            disabled={index === 0}
            onClick={() => onIndexChange(Math.max(0, index - 1))}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 text-white hover:bg-white/15 hover:text-white disabled:opacity-30 sm:left-4"
          >
            <ChevronLeft className="size-7" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            disabled={index === items.length - 1}
            onClick={() => onIndexChange(Math.min(items.length - 1, index + 1))}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 text-white hover:bg-white/15 hover:text-white disabled:opacity-30 sm:right-4"
          >
            <ChevronRight className="size-7" />
          </Button>
        </>
      )}

      {/* Content */}
      <div className="flex h-full w-full flex-col items-center justify-center px-4 py-14">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          {item.kind === "video" ? (
            <ModalVideo key={item.videoSrc} src={item.videoSrc} poster={item.poster} />
          ) : (
            <ZoomImage key={item.imageSrc} src={item.imageSrc || ""} />
          )}
        </div>

        {/* Bar */}
        <div className="mt-3 flex w-full max-w-3xl shrink-0 items-center justify-between gap-3">
          <div className="min-w-0 text-white/80">
            {item.title && (
              <p className="truncate text-sm font-medium text-white">{item.title}</p>
            )}
            {item.caption && (
              <p className="line-clamp-1 text-xs text-white/60">{item.caption}</p>
            )}
            {many && (
              <span className="text-xs text-white/50 tabular-nums">
                {index + 1} / {items.length}
              </span>
            )}
          </div>
          {item.downloadHref && (
            <Button
              render={<a href={item.downloadHref} download />}
              className="shrink-0 bg-white text-black hover:bg-white/90"
              size="lg"
            >
              <Download className="size-4" />
              Unduh
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Modal video (dengan overlay buffering — panggilan play pertama lambat)
// ---------------------------------------------------------------------------
function ModalVideo({ src, poster }: { src?: string; poster?: string }) {
  const [buffering, setBuffering] = React.useState(true);
  const [err, setErr] = React.useState(false);
  return (
    <div className="relative flex items-center justify-center">
      <video
        src={src}
        poster={poster}
        controls
        autoPlay
        playsInline
        preload="metadata"
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onLoadedData={() => setBuffering(false)}
        onError={() => {
          setBuffering(false);
          setErr(true);
        }}
        className="max-h-[80vh] max-w-full rounded-lg bg-black shadow-2xl"
      />
      {buffering && !err && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/60 text-white/90 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin" />
          <span className="text-xs">Menyiapkan pemutar…</span>
        </div>
      )}
      {err && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/70 text-sm text-white/80">
          Gagal memuat video.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zoom / pan image
// ---------------------------------------------------------------------------
function ZoomImage({ src }: { src: string }) {
  const [scale, setScale] = React.useState(1);
  const [tx, setTx] = React.useState(0);
  const [ty, setTy] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinch = React.useRef<{ d: number; s: number } | null>(null);

  const reset = React.useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);
  React.useEffect(() => reset(), [src, reset]);

  const zoomAt = (cx: number, cy: number, next: number) => {
    next = Math.max(1, Math.min(6, next));
    setScale((s) => {
      const k = next / s;
      setTx((x) => (next === 1 ? 0 : cx - (cx - x) * k));
      setTy((y) => (next === 1 ? 0 : cy - (cy - y) * k));
      return next;
    });
  };
  const centerOffset = (clientX: number, clientY: number): [number, number] => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return [0, 0];
    return [clientX - (r.left + r.width / 2), clientY - (r.top + r.height / 2)];
  };

  return (
    <div
      ref={containerRef}
      className="relative flex max-h-[80vh] max-w-[92vw] touch-none select-none items-center justify-center overflow-hidden"
      onWheel={(e) => {
        e.preventDefault();
        const [cx, cy] = centerOffset(e.clientX, e.clientY);
        zoomAt(cx, cy, scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2));
      }}
      onDoubleClick={(e) => {
        const [cx, cy] = centerOffset(e.clientX, e.clientY);
        zoomAt(cx, cy, scale > 1 ? 1 : 2.5);
      }}
      onPointerDown={(e) => {
        if (scale <= 1) return;
        drag.current = { x: e.clientX, y: e.clientY, tx, ty };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        setTx(drag.current.tx + (e.clientX - drag.current.x));
        setTy(drag.current.ty + (e.clientY - drag.current.y));
      }}
      onPointerUp={() => (drag.current = null)}
      onTouchStart={(e) => {
        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          pinch.current = { d: Math.hypot(dx, dy), s: scale };
        }
      }}
      onTouchMove={(e) => {
        if (pinch.current && e.touches.length === 2) {
          e.preventDefault();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          zoomAt(0, 0, pinch.current.s * (Math.hypot(dx, dy) / pinch.current.d));
        }
      }}
      onTouchEnd={(e) => {
        if (e.touches.length < 2) pinch.current = null;
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
        className={cn(
          "max-h-[80vh] max-w-[92vw] rounded-lg bg-black shadow-2xl will-change-transform",
          scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
        )}
      />
      {/* zoom controls */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/60 p-1 backdrop-blur">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => zoomAt(0, 0, scale / 1.3)}
          className="text-white hover:bg-white/15 hover:text-white"
        >
          <ZoomOut className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={reset}
          className="text-white hover:bg-white/15 hover:text-white"
        >
          <Maximize2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => zoomAt(0, 0, scale * 1.3)}
          className="text-white hover:bg-white/15 hover:text-white"
        >
          <ZoomIn className="size-4" />
        </Button>
      </div>
    </div>
  );
}
