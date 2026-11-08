// Track lists: the header row and one track's row. A row is used in a
// recycling `List`, so it reads its track where it is used and keeps no
// state of its own.

import { Text, untracked, View } from "nsh";
import { Button } from "nsh/base";
import { clock, type Track } from "../../backend/types";
import { isCurrentTrack, player } from "../../state/player";
import { Cover, LAYER, focusRing, terminal } from "../ui/controls";
import { PlayingBars } from "../ui/playing";
import { Icon } from "../ui/icons";
import { enter } from "../ui/motion";

/** The header row above a track list. */
export function TrackHeader(props: { showAlbum: boolean }) {
  if (terminal) return <View class="hidden" />;
  return (
    <View class="mx-3 mb-1 h-8 flex-row items-center gap-3 border-b border-border/60 px-3">
      <Text class="w-6 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">#</Text>
      <View class="w-9" />
      <Text class="flex-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Title</Text>
      <If when={props.showAlbum}>
        <Text class="flex-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Album</Text>
      </If>
      <View class="w-12 items-end">
        <Icon name="clock" size={14} color="muted-foreground" />
      </View>
    </View>
  );
}

/** One track: its number (or a mark while it is the one loaded), cover,
 * title and artists, album and length. */
export function TrackRow(props: {
  track: Track | undefined;
  number: number;
  showAlbum: boolean;
  /** What the second line says: the artists (default), or the album where
   * every row has the same artist (an artist's page), which would only
   * repeat down the list. */
  secondary?: "artists" | "album";
  disabled?: boolean;
  /** Comes in, in layers, after the rows before it. Read once, when the
   * row is made: pass true only while the page is opening, so a row made
   * again later (recycled, or redrawn) just shows. */
  entrance?: boolean;
  onPress: () => void;
}) {
  // The row fades in, its cover grows into place, then its words lift.
  const delay = 120 + Math.min(props.number, 12) * 30;
  const rise = untracked(() => !!props.entrance && !terminal && props.number < 14);
  const current = () => isCurrentTrack(props.track?.uri ?? "");
  const playing = () => current() && player().playing;
  const label = () => (props.track ? `${props.track.name}, ${props.track.artists}` : "");
  return (
    <Button
      accessibilityLabel={label()}
      selected={current()}
      disabled={props.disabled ?? false}
      onPress={props.onPress}
      class={
        terminal
          ? "flex-row gap-2 px-1 focus:bg-muted selected:bg-muted"
          : `group mx-3 h-12 flex-row items-center gap-3 rounded-(--radius) px-3 transition duration-150 ease-out hover:bg-row-hover active:bg-muted selected:bg-row-hover disabled:opacity-50 motion-reduce:transition-none ${focusRing}`
      }
      classList={{ "opacity-45": !!props.track && !props.track.playable }}
      style={rise ? enter("fadeIn", delay) : undefined}
    >
      <View class="w-6 items-end">
        <If
          when={current() && !terminal}
          else={
            <View class="relative items-end justify-center">
              <Text class={`text-xs tabular-nums text-muted-foreground ${LAYER} group-hover:opacity-0 group-hover:-translate-y-1`}>
                {props.number + 1}
              </Text>
              <If when={!terminal}>
                <View class={`absolute right-0 opacity-0 scale-50 ${LAYER} group-hover:opacity-100 group-hover:scale-100 group-active:scale-90`}>
                  <Icon name="play" size={12} color="foreground" />
                </View>
              </If>
            </View>
          }
        >
          <PlayingBars playing={playing()} />
        </If>
      </View>
      <View style={rise ? enter("zoomIn", delay + 60) : undefined}>
        <Cover src={props.track?.image ?? ""} size={36} fallback="music" class="rounded-sm" />
      </View>
      <View class={terminal ? "min-w-0 flex-1 flex-row gap-2" : "min-w-0 flex-1 gap-0.5"} style={rise ? enter("fadeInUp", delay + 90) : undefined}>
        <Text class={`line-clamp-1 text-sm text-foreground ${current() ? "font-semibold" : "font-medium"}`}>{props.track?.name ?? ""}</Text>
        <View class="flex-row items-center gap-1.5">
          <If when={!!props.track?.explicit && !terminal}>
            <Text accessibilityLabel="Explicit" class="rounded-sm bg-muted-foreground px-1 text-[9px] font-bold text-background">
              E
            </Text>
          </If>
          <Text class="line-clamp-1 flex-1 text-xs text-muted-foreground">
            {(props.secondary === "album" ? props.track?.album : props.track?.artists) ?? ""}
          </Text>
        </View>
      </View>
      <If when={props.showAlbum}>
        <Text class="line-clamp-1 min-w-0 flex-1 text-xs text-muted-foreground">{props.track?.album ?? ""}</Text>
      </If>
      <Text class="w-12 text-right text-xs tabular-nums text-muted-foreground">{props.track ? clock(props.track.durationMs) : ""}</Text>
    </Button>
  );
}
