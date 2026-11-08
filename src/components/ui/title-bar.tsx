// The window's title bar, drawn by the app. nsh.json hides the system's on
// every desktop (`window.titleBar.style: "hidden"`), so the content fills the
// window to its top edge. No band runs across the window: only the column
// the system's window controls sit over (macOS's traffic lights at the left,
// Windows' caption buttons at the right, GTK's where the desktop puts them)
// starts below them, and that gap drags the window (double-click maximizes).
// In full screen the platform reports no title bar, and the gap goes.
// Nothing on the web, phones and terminals.

import { View } from "nsh";
import { isAvailable as hasWindow, titleBar } from "nsh/desktop";
import { terminal } from "./controls";

/** Whether this window's title bar is the app's to draw. */
export const drawsTitleBar = hasWindow && !terminal;

/** The title bar area the app draws (reactive): its height and the widths
 * the window controls take at each end; all 0 where it draws none (full
 * screen, the web, phones, terminals). For a view that places itself
 * against the window controls (Now Playing's top row) rather than below a
 * `TitleBar`. */
export function titleBarArea(): { height: number; left: number; right: number } {
  if (!drawsTitleBar) return { height: 0, left: 0, right: 0 };
  return titleBar();
}

/** Whether the window controls sit at `side` of the window. */
function controlsAt(side: "left" | "right" | "any") {
  if (!drawsTitleBar) return false;
  const bar = titleBar();
  if (bar.height <= 0) return false;
  if (side === "any") return true;
  return side === "left" ? bar.left > 0 : bar.right > 0;
}

/** The draggable gap that keeps a column clear of the window controls, as
 * tall as the title bar the system would have had. Put it first in a column
 * that reaches the window's top edge at `side` (the desktop's sidebar at the
 * left, its pages at the right); `"any"` for one as wide as the window (the
 * phone shell, the left sheet). */
export function TitleBar(props: { side?: "left" | "right" | "any" }) {
  return (
    <If when={controlsAt(props.side ?? "any")}>
      <View testID="title-bar" desktop={{ windowDrag: true }} class="shrink-0" style={{ height: titleBar().height }} />
    </If>
  );
}
