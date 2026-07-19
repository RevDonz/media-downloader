"use client";

import { useState } from "react";
import { Loader2, Music2, Search } from "lucide-react";
import { toast } from "sonner";

import { useTiktokFetch } from "@/hooks/useTiktokFetch";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { buildDownloadUrl, fmtDuration, proxyImg } from "@/lib/media";
import type { ModalMedia } from "@/components/media/media";
import { Grid, GridSkeleton, MediaCard, MediaModal } from "@/components/media/media";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = query.trim();
    if (!url.includes("tiktok.com")) {
      toast.error("Tempel link TikTok yang valid");
      return;
    }
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
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tempel link video / profil TikTok…"
          className="h-11 flex-1 rounded-lg"
        />
        <Button
          type="submit"
          disabled={state.loading}
          className="h-11 rounded-lg bg-tt-gradient text-white sm:w-32"
        >
          {state.loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          Cari
        </Button>
      </form>

      <div className="mt-8">
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
                : "Tempel link video atau profil TikTok untuk mulai."}
            </p>
          </div>
        )}
      </div>

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
