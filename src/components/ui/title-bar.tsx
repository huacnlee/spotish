// The window's title bar, drawn by the app. nsh.json hides the system's
// (`window.titleBar: { style: "hidden", height: 40 }`), and Linux takes it
// back (`installDesktopShell`): there the bar is 0 high and draws nothing.
// One bar runs across the top of the window, clear of the system's window
// controls (macOS's traffic lights at the left, centred in its 40 points;
// Windows' caption buttons at the right), and shows the app's mark and
// name, then the header's controls (Back, Forward, search, the account).
// The rest of the bar drags the window (double-click maximizes). In full
// screen the platform reports no title bar, and the bar goes. Nothing on the web, phones and terminals.

import { type JSX, Text, View } from "nsh";
import { isAvailable as hasWindow, titleBar } from "nsh/desktop";
import { Logo } from "../../ui/logo";
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

/** The title bar, as wide as the view it heads (the window, or the left
 * sheet that covers its top): the mark and the name after the window
 * controls, or, with `brand={false}`, only the draggable room for them.
 * `children` follow the name (the desktop's: the header's controls), from
 * `inset` points from the window's left edge when the name leaves room
 * (where the pages begin). */
export function TitleBar(props: { brand?: boolean; inset?: number; children?: JSX.Element }) {
  const left = () => titleBarArea().left + (titleBarArea().left > 0 ? 4 : 14);
  return (
    <If when={titleBarArea().height > 0}>
      <View
        testID="title-bar"
        desktop={{ windowDrag: true }}
        class="shrink-0 flex-row items-center gap-2"
        style={{
          height: titleBarArea().height,
          paddingLeft: left(),
          paddingRight: titleBarArea().right + 14,
        }}
      >
        <If when={props.brand !== false}>
          <View class="flex-row items-center gap-2" style={{ minWidth: Math.max(0, (props.inset ?? 0) - left()) }}>
            <Logo size={18} />
            <Text class="text-sm font-semibold text-foreground">Spotish</Text>
          </View>
        </If>
        {props.children}
      </View>
    </If>
  );
}
