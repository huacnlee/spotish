// Which shell the window gets: the desktop's (sidebar, pages, player bar),
// the phone's (one column, tabs, a mini player) or the terminal's. A desktop
// window keeps the desktop's at any size: narrow, its sidebar is a rail and
// its player bar keeps only what fits.

import { platform, windowSize } from "nsh";
import { friendsCollapsed } from "../state/friends-panel";
import { signedIn } from "../state/session";
import { sidebarCollapsed } from "../state/sidebar";

export type Layout = "desktop" | "phone" | "terminal";

/** With the pages narrower than this, the desktop's player bar is compact:
 * one row, what plays on the left, the transport on the right, no position
 * or volume. */
const COMPACT_BAR = 760;
/** Narrower than this, it is stacked: two rows, what plays over the
 * transport. */
const STACKED_BAR = 520;
/** The desktop sidebar's widths (a rail, and open), and the shell's gaps
 * around and between it and the pages. */
const RAIL_WIDTH = 72;
/** The open sidebar's width, pt: 274 in a wide window, 228 in a middle one
 * (860 to 1100pt), so the pages keep their room. The user menu is as wide
 * as the account row (`accountMenuWidth`), so it lines up with it edge to
 * edge at either width. */
const SIDEBAR_WIDE = 274;
const SIDEBAR_MIDDLE = 228;
/** The account panel's padding and border on each side (8 + 1). */
const ACCOUNT_INSET = 2 * (8 + 1);
const SHELL_GAPS = 3 * 8;
/** The friend activity panel's width and the gap before it, and the window
 * width from which it has room beside the sidebar and the pages. */
const FRIENDS_WIDTH = 300;
const FRIENDS_MIN_WINDOW = 1000;
/** Narrower than this, a page in a browser gets the phone's layout. */
const WEB_NARROW = 640;
/** Narrower than this, the desktop's sidebar is a rail. */
const RAIL = 860;
/** Wider than this, track lists have room for an album column. */
const ALBUM_COLUMN = 1100;

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
  // The pages' width, which the bar floats over.
  const w = windowSize().width - sidebarWidth() - friendsWidth() - (sidebarShown() ? SHELL_GAPS : 2 * 8);
  return w < STACKED_BAR ? "stacked" : w < COMPACT_BAR ? "compact" : "full";
};

/** Whether the desktop's sidebar is a rail of icons (tracked): the window
 * is too narrow for it open. */
export const railSidebar = () => windowSize().width < RAIL;

/** Whether the desktop's sidebar shows at all (tracked): the user can fold
 * it away entirely. */
export const sidebarShown = () => !sidebarCollapsed();

/** The desktop sidebar's width now, pt (tracked). */
export const sidebarWidth = () =>
  !sidebarShown() ? 0 : railSidebar() ? RAIL_WIDTH : windowSize().width < ALBUM_COLUMN ? SIDEBAR_MIDDLE : SIDEBAR_WIDE;

/** Whether the desktop's friend activity panel has room (tracked): signed
 * in, not folded away by the user, and a window wide enough. */
export const friendsAvailable = () => layout() === "desktop" && signedIn() === true && windowSize().width >= FRIENDS_MIN_WINDOW;

/** Whether the panel shows (tracked). */
export const friendsShown = () => friendsAvailable() && !friendsCollapsed();

/** The panel's width now, pt, with the gap before it (tracked). */
export const friendsWidth = () => (friendsShown() ? FRIENDS_WIDTH + 8 : 0);

/** The user menu's width, pt (tracked): the account row's, so it opens flush
 * with it; from the rail or the header, the wide sidebar's row. */
export const accountMenuWidth = () => (railSidebar() || !sidebarShown() ? SIDEBAR_WIDE : sidebarWidth()) - ACCOUNT_INSET;

/** Whether there is room for the album column of track lists (tracked). */
export const wideTracks = () => layout() === "desktop" && windowSize().width > ALBUM_COLUMN;

/** The room a page leaves at its end: on the desktops the player floats
 * over the bottom of the pages, so their last rows scroll clear of it. */
export const pageEnd = () => (layout() !== "desktop" ? "pb-8" : barSize() === "stacked" ? "pb-36" : "pb-28");

/** How much of a page's bottom the floating player covers, points (as
 * `pageEnd`'s room): what the keyboard scrolls a row clear of. */
export const playerOverlap = () => (layout() !== "desktop" ? 0 : barSize() === "stacked" ? 144 : 112);
