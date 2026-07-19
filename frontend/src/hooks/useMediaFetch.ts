"use client";

import { useCallback, useRef, useState } from "react";
import { igFetch, igMore, igExtra } from "@/lib/api";
import type { FetchResponse, IgMediaBuckets, IgProfile } from "@/lib/types";

const EMPTY: IgMediaBuckets = { posts: [], reels: [], stories: [], highlights: [] };

export interface IgState {
  query: string;
  loading: boolean;
  loadingMore: boolean;
  loadingExtra: boolean;
  token: string | null;
  hasMore: boolean;
  profile: IgProfile | null;
  loggedIn: boolean;
  media: IgMediaBuckets;
  warnings: string[];
  error: string | null;
  loaded: boolean;
}

const INIT: IgState = {
  query: "",
  loading: false,
  loadingMore: false,
  loadingExtra: false,
  token: null,
  hasMore: false,
  profile: null,
  loggedIn: false,
  media: EMPTY,
  warnings: [],
  error: null,
  loaded: false,
};

function mergeWarn(a: string[], b?: string[]) {
  return [...new Set([...(a || []), ...(b || [])])];
}

/** Orkestrasi Instagram: fetch → extra (latar) → more (infinite scroll). */
export function useMediaFetch(sessionid: string) {
  const [state, setState] = useState<IgState>(INIT);
  const mirror = useRef(state);
  mirror.current = state;
  const reqId = useRef(0);
  const busy = useRef(false); // guard sinkron anti double-fetch infinite scroll
  const sidRef = useRef(sessionid);
  sidRef.current = sessionid;

  const loadExtra = useCallback(async (token: string, myReq: number) => {
    setState((s) => ({ ...s, loadingExtra: true }));
    try {
      const data = await igExtra(token);
      if (reqId.current !== myReq) return;
      setState((s) => ({
        ...s,
        loadingExtra: false,
        media: {
          ...s.media,
          stories: data.stories || [],
          highlights: data.highlights || [],
        },
        warnings: mergeWarn(s.warnings, data.warnings),
      }));
    } catch {
      if (reqId.current !== myReq) return;
      setState((s) => ({ ...s, loadingExtra: false }));
    }
  }, []);

  const search = useCallback(
    async (query: string) => {
      const myReq = ++reqId.current;
      busy.current = false;
      setState({ ...INIT, query, loading: true });
      try {
        const data: FetchResponse = await igFetch(query, sidRef.current);
        if (reqId.current !== myReq) return;
        setState((s) => ({
          ...s,
          loading: false,
          loaded: true,
          token: data.token,
          hasMore: !!data.has_more,
          loggedIn: !!data.logged_in,
          profile: data.profile,
          media: {
            ...EMPTY,
            posts: data.media.posts || [],
            reels: data.media.reels || [],
          },
          warnings: data.warnings || [],
        }));
        if (!data.single && data.token) loadExtra(data.token, myReq);
      } catch (e) {
        if (reqId.current !== myReq) return;
        setState((s) => ({ ...s, loading: false, loaded: true, error: (e as Error).message }));
      }
    },
    [loadExtra],
  );

  const loadMore = useCallback(async () => {
    const s = mirror.current;
    if (busy.current || !s.token || !s.hasMore) return;
    busy.current = true;
    setState((p) => ({ ...p, loadingMore: true }));
    try {
      const data = await igMore(s.token);
      setState((p) => ({
        ...p,
        loadingMore: false,
        hasMore: !!data.has_more,
        media: {
          ...p.media,
          posts: [...p.media.posts, ...(data.posts || [])],
          reels: [...p.media.reels, ...(data.reels || [])],
        },
      }));
    } catch {
      setState((p) => ({ ...p, loadingMore: false, hasMore: false }));
    } finally {
      busy.current = false;
    }
  }, []);

  const reset = useCallback(() => setState(INIT), []);

  return { state, search, loadMore, reset };
}
