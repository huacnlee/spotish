// The player's parts, shared by the desktop bar, the phone's mini player,
// Now Playing and the terminal: the transport, the position, the volume,
// Like and what plays. They read the player store and call its intents.

import { cleanup, createMotion, effect, signal, Text, View } from "nsh";
import { Button } from "nsh/base";
import { clock } from "../../backend/types";
import { openPremium } from "../../state/links";
import { setNowPlayingOpen } from "../../state/overlays";
import {
  controlsEnabled,
  cycleRepeat,
  dragSeek,
  dragVolume,
  hasTrack,
  next,
  player,
  position,
  previous,
  seek,
  setVolume,
  toggle,
  toggleLike,
  toggleMute,
  toggleShuffle,
  volumeLevel,
} from "../../state/player";
import { ready } from "../../state/session";
import { BarSlider, Cover, focusRing, IconButton, PlayButton, terminal, TextLink } from "../ui/controls";
import type { IconName } from "../ui/icons";

const REPEAT_LABEL = { off: "Repeat", context: "Repeat one", track: "Don't repeat" } as const;

/** Shuffle, previous, play / pause, next and repeat. */
export function TransportControls(props: { large?: boolean; minimal?: boolean }) {
  const icon = () => (props.large ? 26 : 18);
  const side = () => (props.large ? 22 : 18);
  const usable = () => controlsEnabled() && !player().ad;
  return (
    <View class={`flex-row items-center ${props.large ? "gap-6" : "gap-4"}`} role="toolbar" accessibilityLabel="Playback">
      <If when={!props.minimal}>
        <IconButton
          name="shuffle"
          label="Shuffle"
          size={side()}
          pressed={player().shuffle}
          tinted
          disabled={!usable() || !player().shuffleAvailable}
          onPress={toggleShuffle}
        />
      </If>
      <IconButton name="skipBack" label="Previous" short="Prev" size={icon()} disabled={!usable() || !player().canPrevious} onPress={previous} />
      <PlayButton tinted playing={player().playing} size={props.large ? 68 : 36} disabled={!ready() || !hasTrack()} onPress={toggle} />
      <IconButton name="skipForward" label="Next" size={icon()} disabled={!usable() || !player().canNext} onPress={next} />
      <If when={!props.minimal}>
        <IconButton
          name={player().repeat === "track" ? "repeatOne" : "repeat"}
          label={REPEAT_LABEL[player().repeat]}
          short={player().repeat === "off" ? "Repeat" : player().repeat === "context" ? "Repeat: all" : "Repeat: one"}
          size={side()}
          pressed={player().repeat !== "off"}
          tinted
          disabled={!usable()}
          onPress={cycleRepeat}
        />
      </If>
    </View>
  );
}

/** The playback position: a slider with the elapsed and total times beside
 * it (`inline`) or under it. Seeking is off during an ad. */
export function SeekBar(props: { inline?: boolean }) {
  const duration = () => Math.max(1, player().durationMs);
  const elapsed = () => <Text class="text-xs tabular-nums font-mono text-muted-foreground">{clock(position())}</Text>;
  const total = () => (
    <Text class="text-xs tabular-nums font-mono text-muted-foreground">{clock(hasTrack() ? player().durationMs : 0)}</Text>
  );
  const slider = (
    <BarSlider
      tinted
      label="Playback position"
      value={position()}
      max={duration()}
      disabled={!controlsEnabled() || player().ad}
      class="flex-1"
      onChange={dragSeek}
      onChangeEnd={seek}
    />
  );
  if (props.inline) {
    return (
      <View class="w-full flex-row items-center gap-2">
        <View class="w-10 items-end">{elapsed()}</View>
        {slider}
        <View class="w-10">{total()}</View>
      </View>
    );
  }
  return (
    <View class="w-full gap-1">
      <View class="flex-row">{slider}</View>
      <View class="flex-row justify-between">
        {elapsed()}
        {total()}
      </View>
    </View>
  );
}

/** Mute and the volume slider. */
export function VolumeControl(props: { class?: string; collapsible?: boolean }) {
  const icon = (): IconName => {
    const v = volumeLevel();
    if (v <= 0) return "volumeMute";
    if (v < 0.5) return "volumeLow";
    return "volume";
  };
  // Collapsible: the slider opens while the pointer is on the control, while
  // the keyboard is in it, and while it is dragged; Mute stays visible.
  const hovering = signal(false);
  const dragging = signal(false);
  const open = () => !props.collapsible || hovering() || dragging();
  return (
    <View
      class={`group flex-row items-center ${props.class ?? ""}`}
      onMouseEnter={() => hovering.set(true)}
      onMouseLeave={() => hovering.set(false)}
    >
      <IconButton
        name={icon()}
        label={player().muted ? "Unmute" : "Mute"}
        disabled={!ready() || !hasTrack()}
        onPress={toggleMute}
      />
      <If when={!terminal}>
        <View
          class={`overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none ${
            open() ? "w-18 opacity-100" : "w-0 opacity-0 focus-within:w-18 focus-within:opacity-100"
          }`}
        >
          <View class="w-18 pl-1 pr-3">
            <BarSlider
              tinted
              label="Volume"
              value={volumeLevel()}
              max={1}
              disabled={!ready() || !hasTrack()}
              class="w-full"
              onChange={(v) => {
                dragging.set(true);
                dragVolume(v);
              }}
              onChangeEnd={(v) => {
                dragging.set(false);
                setVolume(v);
              }}
            />
          </View>
        </View>
      </If>
    </View>
  );
}

/** Saves the track to Liked Songs, or removes it; the heart beats as it
 * turns on. */
export function LikeButton(props: { size?: number }) {
  const beat = createMotion();
  let was = player().liked;
  effect(() => {
    const now = player().liked;
    if (now && !was) void beat.play("heartbeat", { duration: 600 });
    was = now;
  });
  cleanup(() => beat.stop());
  return (
    <View style={beat.style}>
    <IconButton
      name={player().liked ? "heartFilled" : "heart"}
      label={player().liked ? "Remove from Liked Songs" : "Save to Liked Songs"}
      short={player().liked ? "Liked" : "Like"}
      size={props.size ?? 18}
      pressed={player().liked}
      pressedColor="liked"
      disabled={!controlsEnabled() || player().ad}
      onPress={toggleLike}
    />
    </View>
  );
}

/** What plays: the cover (`cover` points; 0 for none), which opens Now
 * Playing when `openable`, the title and the artist; during an ad, the ad's own artwork and title, and a link to
 * Premium. */
export function NowPlayingSummary(props: { cover?: number; round?: boolean; openable?: boolean; large?: boolean }) {
  const subtitle = () => (player().ad ? "Advertisement" : player().artist);
  const cover = () => <Cover src={player().artwork} size={props.cover ?? 56} round={props.round} />;
  return (
    <View class="min-w-0 flex-1 flex-row items-center gap-3">
      <If when={!terminal && props.cover !== 0}>
        <If when={props.openable && hasTrack()} else={cover()}>
          <Button
            accessibilityLabel="Open Now Playing"
            onPress={() => setNowPlayingOpen(true)}
            class={`rounded-md hover:opacity-85 active:scale-95 motion-reduce:active:scale-100 ${focusRing}`}
          >
            {cover()}
          </Button>
        </If>
      </If>
      <View class="min-w-0 flex-1 gap-0.5">
        <Text class={`line-clamp-1 font-semibold text-foreground ${props.large ? "text-3xl font-extrabold" : "text-sm"}`}>
          {player().title || "Nothing playing"}
        </Text>
        <View class="min-w-0 flex-row items-center gap-2">
          <Text class={`line-clamp-1 min-w-0 shrink text-muted-foreground ${props.large ? "text-base" : "text-xs"}`}>{subtitle()}</Text>
          <If when={player().ad}>
            <TextLink label="Get Premium" onPress={openPremium} />
          </If>
        </View>
      </View>
    </View>
  );
}
