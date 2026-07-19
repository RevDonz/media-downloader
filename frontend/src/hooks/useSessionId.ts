"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "ig_sessionid";

/** Simpan cookie sessionid Instagram di localStorage. */
export function useSessionId() {
  const [sessionid, setSessionid] = useState("");

  useEffect(() => {
    try {
      setSessionid(localStorage.getItem(KEY) || "");
    } catch {
      /* ignore */
    }
  }, []);

  const save = useCallback((v: string) => {
    setSessionid(v);
    try {
      if (v) localStorage.setItem(KEY, v);
      else localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const clear = useCallback(() => save(""), [save]);

  return { sessionid, save, clear };
}
