// Now Playing: the cover large, what plays and the full transport, in a
// full-screen sheet over the app (Escape, back and the chevron close it).

import { View, windowSize } from "nsh";
import { coverColorsQuery } from "../../data/queries";
import { nowPlayingOpen, setNowPlayingOpen } from "../../state/overlays";
import { player } from "../../state/player";
import { Cover, IconButton } from "../ui/controls";
import { AppSheet } from "../ui/overlays";
import { MusicLight } from "../ui/toolbar-fx";
import { LikeButton, NowPlayingSummary, SeekBar, TransportControls, VolumeControl } from "./parts";

function NowPlayingContent() {
  // The same colour as the desktop's player: the cover's.
  const colors = coverColorsQuery(() => player().artwork);

  return (
    <View class="flex-1 bg-sidebar pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* The music's light rises from the bottom of the page. */}
      <MusicLight effect="spectrum" colors={colors()} playing={player().playing} reach={windowSize().height * 0.3} />
      <View class="flex-row px-4 pt-4">
        <IconButton name="chevronLeft" label="Close Now Playing" short="Back" size={22} onPress={() => setNowPlayingOpen(false)} />
      </View>
      <View class="flex-1 items-center justify-center gap-6 px-6 pb-8">
        <View class="w-full max-w-64 items-center">
          <Cover src={player().artwork} class="rounded-2xl shadow-xl" />
        </View>
        <View class="w-full max-w-130 gap-6">
          <View class="flex-row items-center gap-4">
            <NowPlayingSummary large cover={0} />
            <LikeButton size={24} />
          </View>
          <SeekBar />
          <View class="items-center">
            <TransportControls large />
          </View>
          <View class="items-center">
            <VolumeControl />
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
