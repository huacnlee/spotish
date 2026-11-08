// Which shell the window gets: the desktop's (sidebar, pages, player bar),
// the phone's (one column, tabs, a mini player) or the terminal's. A desktop
// window keeps the desktop's at any size: narrow, its sidebar is a rail and
// its player bar keeps only what fits.

import { platform, windowSize } from "nsh";

export type Layout = "desktop" | "phone" | "terminal";

/** Narrower than this, the desktop's player bar is compact: what plays and
 * the transport, without the position and the volume slider. */
const COMPACT_BAR = 900;
/** Narrower than this, a page in a browser gets the phone's layout. */
const WEB_NARROW = 640;
/** Narrower than this, the compact bar also leaves out the light menu. */
const TINY_BAR = 640;
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

/** How much the desktop's player bar shows (tracked). */
export const barSize = (): "full" | "compact" | "tiny" => {
  const w = windowSize().width;
  return w < TINY_BAR ? "tiny" : w < COMPACT_BAR ? "compact" : "full";
};

/** Whether the desktop's sidebar is a rail of icons (tracked). */
export const railSidebar = () => windowSize().width < RAIL;

/** Whether there is room for the album column of track lists (tracked). */
export const wideTracks = () => layout() === "desktop" && windowSize().width > RAIL;

/** The room a page leaves at its end: on the desktops the player floats
 * over the bottom of the pages, so their last rows scroll clear of it. */
export const pageEnd = () => (layout() === "desktop" ? "pb-28" : "pb-8");
