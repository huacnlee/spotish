// A cache-first data layer. A request shows the cached value immediately (from
// memory, hydrated from Storage on launch), then revalidates in the background
// and updates. Offline or on error, the cached value stays. This makes moving
// between library items and pages instant after the first visit.

import { type Accessor, cleanup, effect, signal, Storage } from "nsh";

const PREFIX = "cache:";
const mem = new Map<string, unknown>();

/** Load persisted entries into memory once, at launch. */
export async function hydrate(): Promise<void> {
  try {
    const keys = await Storage.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(PREFIX))
        .map(async (k) => {
          const raw = await Storage.getItem(k);
          if (raw) {
            try {
              mem.set(k.slice(PREFIX.length), JSON.parse(raw));
            } catch {}
          }
        }),
    );
  } catch {}
}

function cacheGet<T>(key: string): T | undefined {
  return mem.get(key) as T | undefined;
}

function cacheSet(key: string, value: unknown): void {
  mem.set(key, value);
  Storage.setItem(PREFIX + key, JSON.stringify(value)).catch(() => {});
}

export interface Cached<T> {
  /** The cached value, then the fresh one; undefined until the first load. */
  data: Accessor<T | undefined>;
  /** True only while loading with nothing cached to show. */
  loading: Accessor<boolean>;
  /** The last revalidation error, if the cache was empty. */
  error: Accessor<string | undefined>;
}

/** Cache-first data for a changing `key`: shows the cache at once, revalidates
 * with `fetcher`, and keeps the cache on failure. */
export function cached<T>(key: () => string, fetcher: (key: string) => Promise<T>): Cached<T> {
  const data = signal<T | undefined>(undefined);
  const loading = signal(false);
  const error = signal<string | undefined>(undefined);
  effect(() => {
    const k = key();
    const hit = cacheGet<T>(k);
    // Cache-first: show whatever we have for this key immediately.
    data.set(hit);
    loading.set(hit === undefined);
    error.set(undefined);
    let stale = false;
    fetcher(k).then(
      (value) => {
        if (stale) return;
        cacheSet(k, value);
        data.set(value);
        loading.set(false);
      },
      (e) => {
        if (stale) return;
        loading.set(false);
        if (cacheGet<T>(k) === undefined) error.set(String(e));
      },
    );
    cleanup(() => {
      stale = true;
    });
  });
  return { data, loading, error };
}
