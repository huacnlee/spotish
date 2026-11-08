// Which shell the window gets: the desktop's (sidebar, pages, player bar),
// the phone's (one column, tabs, a mini player) or the terminal's. A narrow
// desktop window gets the phone's.

import { platform, windowSize } from "nsh";

export type Layout = "desktop" | "phone" | "terminal";

/** Narrower than this, a desktop window gets the phone's layout. */
const NARROW = 640;
/** Narrower than this, the desktop's sidebar is a rail. */
const RAIL = 1100;

/** The layout for the window now (tracked). */
export function layout(): Layout {
  if (platform.idiom === "terminal") return "terminal";
  if (!platform.desktop || windowSize().width < NARROW) return "phone";
  return "desktop";
}

/** Whether the desktop's sidebar is a rail of icons (tracked). */
export const railSidebar = () => windowSize().width < RAIL;

/** Whether there is room for the album column of track lists (tracked). */
export const wideTracks = () => layout() === "desktop" && windowSize().width > RAIL;

/** The room a page leaves at its end: on the desktops the player floats
 * over the bottom of the pages, so their last rows scroll clear of it. */
export const pageEnd = () => (layout() === "desktop" ? "pb-28" : "pb-8");
