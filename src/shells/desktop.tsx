// The desktop's shell: the sidebar (a rail on narrow windows) down the left,
// and the pages on the right with the player floating over their bottom, a
// translucent pill the pages scroll behind.

import { View } from "nsh";
import { barSize, railSidebar, sidebarShown, sidebarWidth } from "../components/layout";
import { animateLayoutOn } from "../components/ui/motion";
import { Sidebar } from "../components/library/sidebar";
import { PlayerBar } from "../components/player/player-bar";
import { MainStack } from "./main";
import { nowPlayingOpen } from "../state/overlays";

export function DesktopShell() {
  // Crossing a breakpoint, the sidebar and the player bar glide to their
  // new arrangement.
  animateLayoutOn(() => `${sidebarWidth()}|${barSize()}`);
  return (
    <View class="flex-1 flex-row gap-2 p-2">
      {/* Folded away by the user, the pages take the whole window. */}
      <If when={sidebarShown()}>
        <View class="shrink-0" style={{ width: sidebarWidth() }}>
          <Sidebar compact={railSidebar()} />
        </View>
      </If>
      <View class="relative min-w-0 flex-1">
        <MainStack class="min-w-0 overflow-hidden" />
        {/* Not drawn under Now Playing: its glass reads what is behind it
            every frame, and there it would show nothing. */}
        <If when={!nowPlayingOpen()}>
          <View class="absolute inset-x-3 bottom-1">
            <PlayerBar />
          </View>
        </If>
      </View>
    </View>
  );
}
