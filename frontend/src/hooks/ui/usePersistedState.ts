import { useEffect, useState } from "react";

export interface PersistedStateOptions<T> {
  /** localStorage key. */
  key: string;
  /** Value to use when nothing valid is stored. */
  defaultValue: T;
  /** Parse the persisted string; return `null` to fall back to `defaultValue`. */
  parse?: (raw: string) => T | null;
  /** Serialise the value for storage. Defaults to `JSON.stringify`. */
  serialize?: (value: T) => string;
  /** When the persisted value equals this, the entry is removed from storage. */
  removeWhen?: (value: T) => boolean;
}

/**
 * `useState`-with-localStorage. SSR-safe (no `window` access during init when
 * `window` is undefined). Use `parse`/`serialize` for non-JSON encodings and
 * `removeWhen` to clean up "default" values rather than persisting noise.
 */
export function usePersistedState<T>({
  key,
  defaultValue,
  parse,
  serialize = JSON.stringify,
  removeWhen,
}: PersistedStateOptions<T>): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultValue;
    try {
      const parsed = parse ? parse(raw) : (JSON.parse(raw) as T);
      return parsed ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (removeWhen?.(value)) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, serialize(value));
  }, [key, value, serialize, removeWhen]);

  return [value, setValue];
}
