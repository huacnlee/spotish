// The player as each shell shows it: the desktop's bar, the phone's mini
// player and the terminal's status rows. All are made of `parts.tsx`.

import { effect, Text, token, View } from "nsh";
import { Button } from "nsh/base";
import { setNowPlayingOpen } from "../../state/overlays";
import { hasTrack, player, toggle } from "../../state/player";
import { ready } from "../../state/session";
import { Cover, focusRing, PlayButton } from "../ui/controls";
import { coverColorsQuery } from "../../data/queries";
import { setCoverTint } from "../../state/tint";
import { lightEffect } from "../../state/visual";
import { LightMenu } from "./light-menu";
import { PlayerGlass } from "../ui/toolbar-fx";
import { barSize } from "../layout";
import { enter } from "../ui/motion";
import { LikeButton, NowPlayingSummary, SeekBar, TransportControls, VolumeControl } from "./parts";

/** The desktop's bar: what plays, the transport over the position, the
 * volume, in a flat pill floating over the pages; it rises in. */
export function PlayerBar() {
  // The light takes the cover's color (the theme's primary until it is known).
  const colors = coverColorsQuery(() => player().artwork);
  const cover = () => colors()[0] ?? "";
  const light = () => cover() || String(token("primary"));
  // The controls take the same colour.
  effect(() => setCoverTint(cover()));
  return (
    <View style={enter("fadeInUp", 120)}>
    <View class="rounded-full shadow-xl">
    <PlayerGlass
      effect={lightEffect()}
      colors={colors()}
      playing={player().playing}
      testID="player"
      class="h-18 flex-row items-center justify-between gap-4 rounded-full pl-3.5 pr-5"
    >
      <If
        when={barSize() === "full"}
        else={
          // Compact (a narrow window): what plays takes the room; the
          // transport without shuffle and repeat, and the position is left
          // to Now Playing, which the left block opens.
          <>
            <View class="min-w-0 flex-1 flex-row items-center gap-2">
              <NowPlayingSummary openable round cover={44} />
              <LikeButton />
            </View>
            <TransportControls quiet minimal />
            <View class="flex-row items-center justify-end gap-1">
              <VolumeControl quiet />
              <If when={barSize() === "compact"}>
                <LightMenu placement="top" />
              </If>
            </View>
          </>
        }
      >
        <View class="w-1/4 min-w-0 flex-row items-center gap-2">
          {/* A smaller round cover, concentric with the pill: 14pt from its
              edge on every side (72 = 44 + 2 × 14). */}
          <NowPlayingSummary openable round cover={44} />
          <LikeButton />
        </View>
        <View class="max-w-180 flex-1 items-center gap-1">
          <TransportControls quiet />
          <SeekBar inline quiet />
        </View>
        <View class="w-1/4 flex-row items-center justify-end gap-1 pr-2">
          {/* The volume always shows its slider here, balancing what plays on
              the left; the light's menu at the very end. */}
          <VolumeControl quiet />
          <LightMenu placement="top" />
        </View>
      </If>
    </PlayerGlass>
    </View>
    </View>
  );
}

/** The phone's mini player, over the tabs; it opens Now Playing. Hidden
 * while nothing is loaded. */
export function MiniPlayer() {
  return (
    <If when={hasTrack()}>
      <View class="mx-2 mb-2 h-14 flex-row items-center gap-3 rounded-(--radius-card) border border-border bg-secondary px-2">
        <Button
          accessibilityLabel={`Open Now Playing: ${player().title}`}
          onPress={() => setNowPlayingOpen(true)}
          class={`min-w-0 flex-1 flex-row items-center gap-3 rounded-(--radius) active:opacity-70 ${focusRing}`}
        >
          <Cover src={player().artwork} size={40} />
          <View class="min-w-0 flex-1 gap-0.5">
            <Text class="line-clamp-1 text-sm font-semibold text-foreground">{player().title}</Text>
            <Text class="line-clamp-1 text-xs text-muted-foreground">{player().ad ? "Advertisement" : player().artist}</Text>
          </View>
        </Button>
        <PlayButton playing={player().playing} size={36} disabled={!ready()} onPress={toggle} />
      </View>
    </If>
  );
}

/** The terminal's player: two rows of text and bracketed controls. */
export function TerminalPlayer() {
  return (
    <View class="border-t border-border">
      <View class="flex-row items-center gap-2">
        <NowPlayingSummary />
        <LikeButton />
      </View>
      <View class="flex-row items-center gap-2">
        <TransportControls />
        <View class="flex-1">
          <SeekBar inline />
        </View>
        <VolumeControl />
      </View>
    </View>
  );
}
