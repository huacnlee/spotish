// The desktop's shell: the sidebar (a rail on narrow windows) down the left,
// and the pages on the right with the player floating over their bottom, a
// translucent pill the pages scroll behind.

import { View } from "nsh";
import { railSidebar } from "../components/layout";
import { SIDEBAR_WIDTH, Sidebar } from "../components/library/sidebar";
import { PlayerBar } from "../components/player/player-bar";
import { MainStack } from "./main";
import { nowPlayingOpen } from "../state/overlays";

export function DesktopShell() {
  return (
    <View class="flex-1 flex-row gap-2 p-2">
      <View class="shrink-0" style={{ width: railSidebar() ? 72 : SIDEBAR_WIDTH }}>
        <Sidebar compact={railSidebar()} />
      </View>
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
