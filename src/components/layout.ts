// Which shell the window gets: the desktop's (sidebar, pages, player bar),
// the phone's (one column, tabs, a mini player) or the terminal's. A desktop
// window keeps the desktop's at any size: narrow, its sidebar is a rail and
// its player bar keeps only what fits.

import { platform, windowSize } from "nsh";

export type Layout = "desktop" | "phone" | "terminal";

/** Narrower than this, the desktop's player bar is compact: one row, what
 * plays on the left, the transport on the right, no position or volume. */
const COMPACT_BAR = 900;
/** Narrower than this, it is stacked: two rows, what plays over the
 * transport. */
const STACKED_BAR = 640;
/** Narrower than this, a page in a browser gets the phone's layout. */
const WEB_NARROW = 640;
/** Narrower than this, the desktop's sidebar is a rail. */
const RAIL = 1100;

/** The layout for the window now (tracked). */
export function layout(): Layout {
  if (platform.idiom === "terminal") return "terminal";
  // A browser's page is as wide as its window: narrow, it is laid out as
  // a phone's (a phone's browser, or a sliver of a desktop's).
  if (!platform.desktop || (platform.os === "web" && windowSize().width < WEB_NARROW)) return "phone";
  return "desktop";
}

/** How the desktop's player bar is laid out (tracked). */
export const barSize = (): "full" | "compact" | "stacked" => {
  const w = windowSize().width;
  return w < STACKED_BAR ? "stacked" : w < COMPACT_BAR ? "compact" : "full";
};

/** Whether the desktop's sidebar is a rail of icons (tracked). */
export const railSidebar = () => windowSize().width < RAIL;

/** Whether there is room for the album column of track lists (tracked). */
export const wideTracks = () => layout() === "desktop" && windowSize().width > RAIL;

/** The room a page leaves at its end: on the desktops the player floats
 * over the bottom of the pages, so their last rows scroll clear of it. */
export const pageEnd = () => (layout() !== "desktop" ? "pb-8" : barSize() === "stacked" ? "pb-36" : "pb-28");
