"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** IntersectionObserver sentinel → panggil onLoadMore saat terlihat.
 *  Re-observe saat sentinel remount (ganti tab) atau saat hasMore/loading berubah
 *  (agar tetap memuat sampai layar penuh). */
export function useInfiniteScroll(opts: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}) {
  const { hasMore, loading, onLoadMore, rootMargin = "700px" } = opts;
  const cb = useRef(onLoadMore);
  cb.current = onLoadMore;

  const node = useRef<HTMLDivElement | null>(null);
  const [version, setVersion] = useState(0);

  const setRef = useCallback((el: HTMLDivElement | null) => {
    if (el !== node.current) {
      node.current = el;
      setVersion((v) => v + 1); // paksa efek observer dibuat ulang saat node berganti
    }
  }, []);

  useEffect(() => {
    const el = node.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && hasMore && !loading) {
          cb.current();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, rootMargin, version]);

  return setRef;
}
