import { useEffect, useState } from "react";

/**
 * Returns the current epoch-ms, re-rendering at the requested interval. Used
 * to expire time-windowed lists without requiring a manual refresh.
 */
export function useNowTick(intervalMs: number = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
