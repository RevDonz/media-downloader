"use client";

import { useCallback, useRef, useState } from "react";
import { fetchMediaInfo } from "@/lib/api";
import type { MediaItem } from "@/lib/types";

const PAGE = 15;

export interface TtState {
  loading: boolean;
  error: string | null;
  items: MediaItem[];
  visible: number; // reveal bertahap di klien untuk performa
  loaded: boolean;
  isSingle: boolean;
}

const INIT: TtState = {
  loading: false,
  error: null,
  items: [],
  visible: PAGE,
  loaded: false,
  isSingle: false,
};

/** TikTok: /api/media/info → single/list, reveal bertahap di klien. */
export function useTiktokFetch() {
  const [state, setState] = useState<TtState>(INIT);
  const reqId = useRef(0);

  const search = useCallback(async (url: string) => {
    const my = ++reqId.current;
    setState({ ...INIT, loading: true });
    try {
      const data = await fetchMediaInfo(url);
      if (reqId.current !== my) return;
      const items = data.type === "single" ? [data.item] : data.items;
      setState({
        loading: false,
        error: null,
        items,
        visible: PAGE,
        loaded: true,
        isSingle: data.type === "single",
      });
    } catch (e) {
      if (reqId.current !== my) return;
      setState({ ...INIT, loaded: true, error: (e as Error).message });
    }
  }, []);

  const loadMore = useCallback(() => {
    setState((s) =>
      s.visible >= s.items.length
        ? s
        : { ...s, visible: Math.min(s.items.length, s.visible + PAGE) },
    );
  }, []);

  const hasMore = state.visible < state.items.length;
  return { state, search, loadMore, hasMore };
}
