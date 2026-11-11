// Whether the user has folded the friend activity panel away, remembered
// between runs. It starts open.

import { signal, Storage } from "nsh";

const KEY = "visual:friends-collapsed";
const collapsed = signal(false);

Storage.getItem(KEY)
  .then((saved) => collapsed.set(saved === "1"))
  .catch(() => {});

/** Whether the panel is folded by the user (tracked). */
export const friendsCollapsed = () => collapsed();

/** Folds the panel, or opens it again, and remembers it. */
export function toggleFriends(): void {
  const next = !collapsed();
  collapsed.set(next);
  Storage.setItem(KEY, next ? "1" : "0").catch(() => {});
}
