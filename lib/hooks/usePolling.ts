"use client";

import { useEffect, useRef } from "react";

/**
 * Polls `callback` on an interval, but skips ticks while the tab is hidden
 * and refetches immediately when it becomes visible again. This keeps live
 * data fresh without burning Vercel Edge Requests on backgrounded tabs.
 */
export function usePolling(callback: () => void | Promise<void>, intervalMs: number) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    savedCallback.current();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        savedCallback.current();
      }
    }, intervalMs);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        savedCallback.current();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs]);
}
