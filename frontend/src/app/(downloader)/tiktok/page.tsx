"use client";

import { useState } from "react";
import { Music2 } from "lucide-react";

import { useTiktokFetch } from "@/hooks/useTiktokFetch";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { buildDownloadUrl, fmtDuration, proxyImg } from "@/lib/media";
import type { ModalMedia } from "@/components/media/media";
import {
  Grid,
  GridSkeleton,
  MediaCard,
  MediaModal,
} from "@/components/media/media";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AccountHeader, AccountSearchBar } from "@/components/downloader/account-ui";

export default function TiktokPage() {
  const { state, search, loadMore, hasMore } = useTiktokFetch();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  const sentinelRef = useInfiniteScroll({
    hasMore,
    loading: state.loading,
    onLoadMore: loadMore,
  });

  function runSearch() {
    const raw = query.trim();
    if (!raw) return;
    // Terima username maupun link — kalau bukan URL tiktok.com, anggap username.
    const url = raw.includes("tiktok.com")
      ? raw
      : `https://www.tiktok.com/@${raw.replace(/^@+/, "")}`;
    search(url);
  }

  function openModal(i: number) {
    setModalIndex(i);
    setModalOpen(true);
  }

  const visible = state.items.slice(0, state.visible);

  const modalItems: ModalMedia[] = state.items.map((it) => ({
    kind: "video",
    videoSrc: it.play,
    poster: proxyImg(it.thumb),
    downloadHref: buildDownloadUrl(it.url, {
      id: "v",
      label: "Video",
      mode: "video",
      quality: "",
      ext: "mp4",
    }),
    title: it.title,
  }));

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <AccountHeader
        brand="TikTok"
        brandClassName="text-tt-gradient"
        description="Unduh video TikTok tanpa watermark — dari link video maupun seluruh profil kreator."
      />

      <AccountSearchBar
        value={query}
        onChange={setQuery}
        onSubmit={runSearch}
        loading={state.loading}
        placeholder="Username atau link TikTok…"
        buttonClassName="bg-tt-gradient"
      />

      {state.loading && !state.loaded ? (
        <Grid className="sm:grid-cols-3 lg:grid-cols-4">
          <GridSkeleton square={false} />
        </Grid>
      ) : state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Gagal memuat</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : state.loaded && visible.length > 0 ? (
        <>
          <Grid className="sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((it, i) => (
              <MediaCard
                key={`${it.url}-${i}`}
                thumb={proxyImg(it.thumb)}
                isVideo
                badge={fmtDuration(it.duration)}
                square={false}
                onClick={() => openModal(i)}
              />
            ))}
          </Grid>
          <div ref={sentinelRef} className="h-1" />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface py-20 text-center animate-fade-up">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-2">
            <Music2 className="size-7 text-tt" />
          </div>
          <p className="text-muted-foreground">
            {state.loaded
              ? "Tidak ada media ditemukan dari link ini."
              : "Tempel username atau link TikTok untuk mulai."}
          </p>
        </div>
      )}

      <MediaModal
        open={modalOpen}
        items={modalItems}
        index={modalIndex}
        onIndexChange={setModalIndex}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
