// Now Playing: the cover large, what plays and the full transport, in a
// full-screen sheet over the app (Escape, back and the down chevron close it).

import { cleanup, createMotion, effect, View, windowSize } from "nsh";
import { coverColorsQuery } from "../../data/queries";
import { nowPlayingOpen, setNowPlayingOpen } from "../../state/overlays";
import { player } from "../../state/player";
import { lightEffect } from "../../state/visual";
import { LightMenu } from "./light-menu";
import { Cover, IconButton } from "../ui/controls";
import { AppSheet } from "../ui/overlays";
import { MusicLight } from "../ui/toolbar-fx";
import { enter } from "../ui/motion";
import { LikeButton, NEW_COVER, NowPlayingSummary, SeekBar, TransportControls, VolumeControl } from "./parts";

function NowPlayingContent() {
  // A new track's cover settles in, as in the bar.
  const coverIn = createMotion();
  let shown = player().artwork;
  effect(() => {
    const now = player().artwork;
    if (now !== shown) void coverIn.play(NEW_COVER);
    shown = now;
  });
  cleanup(() => coverIn.stop());

  // The same colour as the desktop's player: the cover's.
  const colors = coverColorsQuery(() => player().artwork);

  return (
    <View class="flex-1 bg-sidebar pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* The music's light rises from the bottom of the page. */}
      <MusicLight effect={lightEffect()} colors={colors()} playing={player().playing} reach={windowSize().height * 0.45} />
      <View class="flex-row justify-between px-4 pt-4">
        <IconButton name="chevronDown" label="Close Now Playing" short="Back" size={24} onPress={() => setNowPlayingOpen(false)} />
        {/* The corner: the volume (always open here, nothing to reveal) and
            the light. */}
        <View class="flex-row items-center gap-1">
          <VolumeControl quiet />
          <LightMenu placement="bottom" size={22} />
        </View>
      </View>
      <View class="flex-1 items-center justify-center gap-6 px-6 pb-8">
        {/* Opening, in layers: the cover grows in, then the words, the
            position and the controls rise one after another. */}
        <View class="w-full max-w-64 items-center" style={enter("zoomIn", 60)}>
          <View class="w-full" style={coverIn.style}>
            <Cover src={player().artwork} class="rounded-2xl shadow-xl" />
          </View>
        </View>
        {/* The light leads here: the controls are quiet (thin, faint). */}
        <View class="w-full max-w-160 gap-6">
          <View class="flex-row items-center gap-4" style={enter("fadeInUp", 140)}>
            <NowPlayingSummary large cover={0} />
            <LikeButton size={24} />
          </View>
          <View style={enter("fadeInUp", 200)}>
            <SeekBar quiet />
          </View>
          <View class="items-center" style={enter("fadeInUp", 260)}>
            <TransportControls large quiet />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Now Playing, open while the overlay store says so. */
export function NowPlayingSheet() {
  return (
    <AppSheet
      open={nowPlayingOpen()}
      onOpenChange={setNowPlayingOpen}
      side="bottom"
      full
      closeOnSwipe
      testID="now-playing"
    >
      <NowPlayingContent />
    </AppSheet>
  );
}
