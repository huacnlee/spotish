import { expect, test } from "nsh/test";
import type { Friend } from "../backend/types";
import { FRIENDS_KEPT, mergeFriends } from "./friends";

const NOW = 1_000_000_000_000;
const MIN = 60_000;
const friend = (userId: string, minutesAgo: number, extra: Partial<Friend> = {}): Friend => ({
  userId,
  name: userId,
  userImage: "",
  kind: "track",
  uri: `spotify:track:${userId}`,
  title: `song of ${userId}`,
  subtitle: "",
  image: "",
  timestamp: NOW - minutesAgo * MIN,
  playing: false,
  ...extra,
});
const ids = (friends: Friend[]) => friends.map((f) => f.userId);

test("a friend that dropped out of the feed keeps their last row, newest first", () => {
  const before = [friend("a", 10), friend("b", 20), friend("c", 30)];
  const merged = mergeFriends(before, [friend("d", 1), friend("a", 2)], NOW);
  expect(ids(merged)).toEqual(["d", "a", "b", "c"]);
});

test("a friend in both lists takes the fresh row", () => {
  const merged = mergeFriends([friend("a", 90, { title: "old" })], [friend("a", 3, { title: "new" })], NOW);
  expect(merged).toHaveLength(1);
  expect(merged[0].title).toBe("new");
});

test("playing is worked out again: recent tracks only, never a context or the future", () => {
  const merged = mergeFriends(
    [friend("old", 30, { playing: true }), friend("ctx", 1, { kind: "context", playing: true })],
    [friend("now", 1), friend("ep", 2, { kind: "episode" }), friend("future", -5)],
    NOW,
  );
  const playing = Object.fromEntries(merged.map((f) => [f.userId, f.playing]));
  expect(playing).toEqual({ old: false, ctx: false, now: true, ep: true, future: false });
});

test("no more than the most rows are kept, the newest", () => {
  const many = Array.from({ length: FRIENDS_KEPT + 10 }, (_, i) => friend(`u${i}`, i));
  const merged = mergeFriends([], many, NOW);
  expect(merged).toHaveLength(FRIENDS_KEPT);
  expect(merged[0].userId).toBe("u0");
  expect(merged[FRIENDS_KEPT - 1].userId).toBe(`u${FRIENDS_KEPT - 1}`);
});

test("nothing before and nothing fresh is an empty list", () => {
  expect(mergeFriends([], [], NOW)).toEqual([]);
});
