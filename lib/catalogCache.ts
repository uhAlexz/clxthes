import type { ItemProps } from "@/components/ui/ItemCard";

// Per-group catalog cache. Each Roblox group's catalog is cached
// independently (localStorage + in-memory) so adding a new group only
// fetches that one group, and revisits within the TTL hit no network at all.

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY = "clxthes-catalog-cache";

interface CachedGroup {
  items: ItemProps[];
  fetchedAt: number;
}

type CacheShape = Record<string, CachedGroup>;

// Deduplicates concurrent fetches for the same group (e.g. double renders).
const inFlight = new Map<string, Promise<ItemProps[]>>();

function readCache(): CacheShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CacheShape) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: CacheShape) {
  try {
    // Prune expired entries so the blob doesn't grow forever.
    const now = Date.now();
    const pruned: CacheShape = {};
    for (const [id, entry] of Object.entries(cache)) {
      if (now - entry.fetchedAt < CACHE_TTL) {
        pruned[id] = entry;
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    // Quota exceeded / privacy mode — cache is best-effort.
  }
}

async function fetchSingleGroup(groupId: string): Promise<ItemProps[]> {
  const existing = inFlight.get(groupId);
  if (existing) return existing;

  const promise = (async () => {
    const response = await fetch(`/api/groups?ids=${groupId}`);
    if (!response.ok) throw new Error(`Failed to load group ${groupId}`);
    const data = await response.json();
    return (data.items || []) as ItemProps[];
  })();

  inFlight.set(groupId, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(groupId);
  }
}

export async function fetchGroupCatalogs(groupIds: string[]): Promise<ItemProps[]> {
  const cache = readCache();
  const now = Date.now();
  let cacheDirty = false;
  let anySucceeded = false;
  let anyFailed = false;

  const results = await Promise.all(
    groupIds.map(async (id) => {
      const entry = cache[id];
      if (entry && now - entry.fetchedAt < CACHE_TTL) {
        return entry.items;
      }

      try {
        const items = await fetchSingleGroup(id);
        cache[id] = { items, fetchedAt: Date.now() };
        cacheDirty = true;
        anySucceeded = true;
        return items;
      } catch {
        anyFailed = true;
        // Fall back to a stale entry rather than dropping the group entirely.
        return entry?.items ?? [];
      }
    })
  );

  if (cacheDirty) writeCache(cache);

  // Only surface an error when nothing could be loaded at all — a single
  // failing group shouldn't blank out the rest of the feed.
  if (anyFailed && !anySucceeded && results.every((items) => items.length === 0)) {
    throw new Error("Failed to load catalog data");
  }

  // Merge all groups, dedupe by item id, and sort the same way the server
  // does (price desc, then name) so ordering is stable across merges.
  const merged = new Map<number, ItemProps>();
  for (const items of results) {
    for (const item of items) {
      if (!merged.has(item.id)) merged.set(item.id, item);
    }
  }

  return Array.from(merged.values()).sort((left, right) => {
    const priceDelta = (right.price ?? 0) - (left.price ?? 0);
    if (priceDelta !== 0) return priceDelta;
    return (left.name || "").localeCompare(right.name || "");
  });
}
