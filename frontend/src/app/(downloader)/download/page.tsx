"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { fetchMediaInfo } from "@/lib/api";
import type { MediaInfoResponse, MediaItem } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Grid } from "@/components/media/media";
import {
  UrlBar,
  MediaPlayer,
  MediaInfoCard,
  DownloadPanel,
  PlaylistCard,
  EmptyState,
  LoaderSkeleton,
} from "@/components/downloader/downloader-ui";

type Status = "idle" | "loading" | "error" | "single" | "list";

interface State {
  status: Status;
  url: string;
  error?: string;
  data?: MediaInfoResponse;
  active?: MediaItem;
}

function PlayerBlock({ item }: { item: MediaItem }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <MediaPlayer item={item} />
        <MediaInfoCard item={item} />
      </div>
      <aside className="h-fit lg:sticky lg:top-20">
        <DownloadPanel item={item} />
      </aside>
    </div>
  );
}

function DownloadContent() {
  const params = useSearchParams();
  const initialUrl = params.get("url") ?? "";

  const [state, setState] = React.useState<State>({
    status: "idle",
    url: initialUrl,
  });

  const reqRef = React.useRef(0);
  const abortRef = React.useRef<AbortController | null>(null);

  const run = React.useCallback(async (rawUrl: string) => {
    const url = rawUrl.trim();
    if (!url) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const reqId = ++reqRef.current;

    setState((s) => ({ status: "loading", url, data: s.data }));

    try {
      const data = await fetchMediaInfo(url, ctrl.signal);
      if (reqId !== reqRef.current) return;
      if (data.type === "single") {
        setState({ status: "single", url, data, active: data.item });
      } else {
        setState({
          status: "list",
          url,
          data,
          active: data.items[0],
        });
      }
    } catch (err) {
      if (reqId !== reqRef.current || ctrl.signal.aborted) return;
      setState({
        status: "error",
        url,
        error: err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    }
  }, []);

  // Auto-fetch bila ada ?url= awal.
  const autoRan = React.useRef(false);
  React.useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    if (initialUrl.trim()) void run(initialUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  const setUrl = (v: string) => setState((s) => ({ ...s, url: v }));
  const loading = state.status === "loading";

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="sr-only">Unduh Video dari Ratusan Situs</h1>

      <div className="mb-8">
        <UrlBar
          value={state.url}
          onChange={setUrl}
          onSubmit={run}
          loading={loading}
        />
      </div>

      {state.status === "idle" && <EmptyState />}

      {loading && <LoaderSkeleton />}

      {state.status === "error" && (
        <Alert variant="destructive" className="animate-fade-up">
          <AlertTitle>Gagal memuat media</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>{state.error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => run(state.url)}
              disabled={!state.url.trim()}
            >
              <RefreshCw className="size-4" />
              Coba lagi
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {state.status === "single" && state.active && (
        <div className="animate-fade-up">
          <PlayerBlock item={state.active} />
        </div>
      )}

      {state.status === "list" && state.data?.type === "list" && (
        <div className="space-y-8">
          {state.active && (
            <div className="animate-fade-up">
              <PlayerBlock key={state.active.url} item={state.active} />
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              {state.data.title || "Playlist"}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {state.data.items.length} video
              </span>
            </h2>
            <Grid className="grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {state.data.items.map((item) => (
                <PlaylistCard
                  key={item.url}
                  item={item}
                  onOpen={() => {
                    setState((s) => ({ ...s, active: item }));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              ))}
            </Grid>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <LoaderSkeleton />
        </div>
      }
    >
      <DownloadContent />
    </Suspense>
  );
}
