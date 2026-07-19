"use client";

import * as React from "react";
import { Lock, ImageOff } from "lucide-react";

import { useSessionId } from "@/hooks/useSessionId";
import { useMediaFetch } from "@/hooks/useMediaFetch";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { proxyImg } from "@/lib/media";
import type { IgTab } from "@/lib/types";

import {
  Grid,
  MediaCard,
  GridSkeleton,
  MediaModal,
  type ModalMedia,
} from "@/components/media/media";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  IgSearchBar,
  ProfileCard,
  CookieSettingsSheet,
  WarningAlerts,
  MediaTabs,
} from "@/components/instagram/instagram-ui";

export default function InstagramPage() {
  const { sessionid, save } = useSessionId();
  const { state, search, loadMore } = useMediaFetch(sessionid);

  const [query, setQuery] = React.useState("");
  const [tab, setTab] = React.useState<IgTab>("posts");
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [modal, setModal] = React.useState<{ open: boolean; index: number }>({
    open: false,
    index: 0,
  });

  const items = state.media[tab];

  const counts: Record<IgTab, number> = {
    posts: state.media.posts.length,
    reels: state.media.reels.length,
    stories: state.media.stories.length,
    highlights: state.media.highlights.length,
  };

  // Infinite scroll hanya untuk posts & reels
  const sentinelRef = useInfiniteScroll({
    hasMore: state.hasMore,
    loading: state.loadingMore,
    onLoadMore: loadMore,
  });
  const infiniteTab = tab === "posts" || tab === "reels";

  const modalItems: ModalMedia[] = React.useMemo(
    () =>
      items.map((m) =>
        m.type === "video"
          ? {
              kind: "video",
              videoSrc: m.url,
              poster: m.thumb, // backend sudah men-proxy thumbnail cover video
              downloadHref: m.download,
              caption: m.caption,
            }
          : {
              kind: "image",
              imageSrc: proxyImg(m.url, m.filename),
              downloadHref: m.download,
              caption: m.caption,
            },
      ),
    [items],
  );

  const openModal = (i: number) => setModal({ open: true, index: i });
  const closeModal = () => setModal((s) => ({ ...s, open: false }));

  const needsLogin =
    (tab === "stories" || tab === "highlights") && !state.loggedIn;

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-ig-gradient">Instagram</span> Downloader
        </h1>
        <p className="text-sm text-muted-foreground">
          Unduh foto, video, Reels, Story, dan Highlight dari akun publik. Untuk
          akun privat, Story, dan Highlight diperlukan login.
        </p>
      </div>

      <IgSearchBar
        value={query}
        onChange={setQuery}
        onSubmit={() => query.trim() && search(query.trim())}
        loading={state.loading}
        loggedIn={state.loggedIn}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {state.error && (
        <Alert variant="destructive">
          <AlertTitle>Gagal memuat</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <WarningAlerts warnings={state.warnings} />

      {state.loading && (
        <Grid>
          <GridSkeleton count={10} />
        </Grid>
      )}

      {state.profile && (
        <div className="space-y-6 animate-fade-up">
          <ProfileCard profile={state.profile} />

          <MediaTabs
            active={tab}
            onChange={setTab}
            counts={counts}
            loadingExtra={state.loadingExtra}
          />

          {needsLogin ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface py-14 text-center">
              <Lock className="size-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium">Story &amp; Highlight butuh login</p>
                <p className="text-sm text-muted-foreground">
                  Tambahkan sessionid untuk melihat konten ini.
                </p>
              </div>
              <Button onClick={() => setSettingsOpen(true)}>
                Buka Pengaturan Cookie
              </Button>
            </div>
          ) : (tab === "stories" || tab === "highlights") &&
            state.loadingExtra ? (
            <Grid>
              <GridSkeleton count={10} />
            </Grid>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface py-14 text-center text-muted-foreground">
              <ImageOff className="size-8" />
              <p className="text-sm">Tidak ada media pada tab ini.</p>
            </div>
          ) : (
            <>
              <Grid>
                {items.map((m, i) => (
                  <MediaCard
                    key={m.shortcode + i}
                    thumb={m.thumb}
                    isVideo={m.type === "video"}
                    onClick={() => openModal(i)}
                  />
                ))}
                {state.loadingMore && infiniteTab && <GridSkeleton count={6} />}
              </Grid>
              {infiniteTab && <div ref={sentinelRef} className="h-1" />}
            </>
          )}
        </div>
      )}

      <CookieSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        sessionid={sessionid}
        onSave={save}
      />

      <MediaModal
        open={modal.open}
        items={modalItems}
        index={modal.index}
        onIndexChange={(i) => setModal((s) => ({ ...s, index: i }))}
        onClose={closeModal}
      />
    </div>
  );
}
