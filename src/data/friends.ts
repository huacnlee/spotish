// Keeping the friend list across refreshes. Spotify's friend feed exposes only
// five friends at a time, the ones who listened most recently, and takes no
// limit or paging parameter, so each refresh is merged into
// what was shown before: a friend still in the feed gets their new row, and
// one that dropped out keeps the last row seen, so the list grows as
// different friends turn up.

import type { Friend } from "../backend/types";

/** A listen counts as playing when it was within this many ms. */
const LIVE_MS = 5 * 60 * 1000;
/** The most rows kept. */
export const FRIENDS_KEPT = 50;

/** `previous` and `fresh` as one list, newest first, one row per friend
 * (`fresh` wins), with `playing` worked out again at `now`. */
export function mergeFriends(previous: Friend[], fresh: Friend[], now: number): Friend[] {
  const byUser = new Map<string, Friend>();
  for (const friend of [...previous, ...fresh]) byUser.set(friend.userId, friend);
  return [...byUser.values()]
    .map((f) => ({ ...f, playing: f.kind !== "context" && now - f.timestamp >= 0 && now - f.timestamp < LIVE_MS }))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, FRIENDS_KEPT);
}
