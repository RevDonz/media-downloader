"use client";

import { useEffect } from "react";

/** Navigasi keyboard panah kiri/kanan untuk modal galeri. */
export function useModalNav(opts: {
  open: boolean;
  length: number;
  index: number;
  setIndex: (i: number) => void;
}) {
  const { open, length, index, setIndex } = opts;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex(Math.max(0, index - 1));
      else if (e.key === "ArrowRight") setIndex(Math.min(length - 1, index + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, length, index, setIndex]);
}
