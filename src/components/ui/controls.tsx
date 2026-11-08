// The app's styled controls, each wrapping a base component once. Pages and
// app components compose these; they do not restyle base controls.
//
// In a terminal (`terminal`), images do not draw: icon-only controls show a
// short text label, and covers take no Cells.

import { Image, platform, Text, View } from "nsh";
import type { JSX } from "nsh";
import { Button, Slider, Tooltip } from "nsh/base";
import { alpha, tint } from "../../state/tint";
import { imageFor } from "../../data/images";
import { Icon, type IconColor, iconMotion, type IconName } from "./icons";

/** The app runs in a terminal: Cells and text, no images. */
export const terminal = platform.idiom === "terminal";

/** The focus ring every control shares. */
export const focusRing = "focus:outline focus:outline-2 focus:outline-ring";

/** The popup surface every menu, popover and tooltip-like panel shares. */
export const popupSurface = "rounded-(--radius-card) border border-border bg-popover p-1 shadow-lg";

/** A menu row: compact, the same padding, radius and states everywhere. */
export const menuItem =
  "h-8 flex-row items-center rounded-(--radius) px-2.5 hover:bg-muted focus:bg-muted active:bg-muted disabled:opacity-40";

/** How an animated layer of a control moves between its states (rest,
 * hover, press): quick, eased, still with reduced motion. */
export const LAYER = "transition duration-200 ease-out motion-reduce:transition-none";

/** A hint bubble: shown by the desktops while the pointer rests on a
 * control, and as the keyboard focus reaches it. */
export function Hint(props: { label: string }) {
  return (
    <Tooltip class="rounded-(--radius) bg-popover px-2 py-1 shadow-md" placement="right">
      <Text class="text-xs font-medium text-popover-foreground">{props.label}</Text>
    </Tooltip>
  );
}

export interface IconButtonProps {
  name: IconName;
  /** What it does: screen readers say it, a terminal shows it. */
  label: string;
  /** A terminal's shorter label (default `label`). */
  short?: string;
  /** Points (default 18). */
  size?: number;
  /** A toggle that is on: drawn in the primary color, with a dot. */
  pressed?: boolean;
  /** The color while `pressed`, instead of the primary color and the dot
   * (Liked's red heart). */
  pressedColor?: IconColor;
  /** While `pressed`, the colour of what plays (`state/tint`), not the
   * primary. */
  tinted?: boolean;
  disabled?: boolean;
  /** Shows `label` in a tooltip (for icons whose meaning is not obvious). */
  hint?: boolean;
  /** Selected (a navigation destination): screen readers say so. */
  selected?: boolean;
  onPress: () => void;
}

/** A borderless icon button: brighter on hover, primary while `pressed`. */
export function IconButton(props: IconButtonProps) {
  const size = () => props.size ?? 18;
  if (terminal) {
    return (
      <Button
        accessibilityLabel={props.label}
        disabled={props.disabled ?? false}
        selected={props.selected ?? false}
        onPress={props.onPress}
        class="px-1 focus:bg-muted disabled:opacity-50"
      >
        <Text class={props.pressed ? "font-bold text-primary" : "text-foreground"}>[{props.short ?? props.label}]</Text>
      </Button>
    );
  }
  const color = (): IconColor => (props.pressed ? (props.pressedColor ?? "primary") : "foreground");
  const hover = iconMotion();
  return (
    <View onMouseEnter={() => !props.disabled && hover.play(props.name)}>
    <Button
      accessibilityLabel={props.label}
      disabled={props.disabled ?? false}
      selected={props.selected ?? false}
      onPress={props.onPress}
      tooltip={props.hint ? <Hint label={props.label} /> : undefined}
      class={`group relative items-center justify-center rounded-full disabled:opacity-30 ${focusRing}`}
      style={{ width: size() + 16, height: size() + 16 }}
    >
      {/* Layer 1: a translucent disc that grows in under the pointer and
          deepens as it presses: whatever is behind shows through. */}
      <View class={`absolute inset-0 rounded-full bg-foreground/10 opacity-0 scale-50 ${LAYER} group-hover:scale-100 group-hover:opacity-100 group-active:scale-90 group-active:bg-foreground/15 group-disabled:opacity-0`} />
      {/* Layer 2: the glyph brightens (its drawing morphs, `iconMotion`), then
          sinks as it presses. */}
      <View
        class={`${LAYER} group-active:scale-90 group-disabled:scale-100 ${
          props.pressed ? "opacity-100" : "opacity-70 group-hover:opacity-100"
        }`}
      >
        <View style={hover.style}>
          <Icon name={props.name} t={hover.t()} size={size()} color={color()} hex={props.pressed && props.tinted && !props.pressedColor ? alpha(tint(), 0.95) : undefined} />
        </View>
      </View>
      <If when={(props.pressed ?? false) && !props.pressedColor}>
        <View class="absolute bottom-0.5 size-1 rounded-full bg-primary" style={props.tinted ? { backgroundColor: alpha(tint(), 0.95) } : undefined} />
      </If>
    </Button>
    </View>
  );
}

/** The round play / pause button, `size` across. */
export function PlayButton(props: { playing: boolean; size?: number; disabled?: boolean; tinted?: boolean; onPress: () => void }) {
  const size = () => props.size ?? 36;
  const label = () => (props.playing ? "Pause" : "Play");
  if (terminal) {
    return (
      <Button accessibilityLabel={label()} disabled={props.disabled ?? false} onPress={props.onPress} class="px-1 focus:bg-muted disabled:opacity-50">
        <Text class="font-bold text-primary">[{label()}]</Text>
      </Button>
    );
  }
  const hover = iconMotion();
  return (
    <View onMouseEnter={() => !props.disabled && hover.play(props.playing ? "pause" : "play")}>
    <Button
      accessibilityLabel={label()}
      disabled={props.disabled ?? false}
      onPress={props.onPress}
      class={`group items-center justify-center overflow-hidden rounded-full border border-foreground/20 bg-background/80 shadow-md transition duration-200 ease-out hover:scale-[1.06] hover:shadow-xl active:scale-[0.94] active:shadow-sm disabled:opacity-40 disabled:hover:scale-100 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${focusRing}`}
      style={{ width: size(), height: size(), ...(props.tinted ? { backgroundColor: alpha(tint(), 0.16) } : {}) }}
    >
      {/* A shade that deepens as it presses. */}
      <View class={`absolute inset-0 rounded-full bg-foreground opacity-0 ${LAYER} group-hover:opacity-10 group-active:opacity-5`} />
      <View class={`${LAYER} group-active:scale-90`}>
        <View style={hover.style}>
          <Icon name={props.playing ? "pause" : "play"} t={hover.t()} size={size() * 0.4} color="foreground" hex={props.tinted ? tint() : undefined} />
        </View>
      </View>
    </Button>
    </View>
  );
}

/** A labeled button: `primary` for the one emphasized commitment of an
 * area, `outline` (default) for the others. */
export function ActionButton(props: {
  label: string;
  variant?: "primary" | "outline";
  disabled?: boolean;
  onPress: () => void;
}) {
  const primary = () => props.variant === "primary";
  if (terminal) {
    return (
      <Button disabled={props.disabled ?? false} onPress={props.onPress} class="px-1 focus:bg-muted disabled:opacity-50">
        <Text class={primary() ? "font-bold text-primary" : "text-foreground"}>[{props.label}]</Text>
      </Button>
    );
  }
  return (
    <Button
      disabled={props.disabled ?? false}
      onPress={props.onPress}
      class={`group h-9 items-center justify-center overflow-hidden rounded-full px-5 transition duration-200 ease-out hover:scale-[1.04] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${focusRing} ${
        primary() ? "bg-foreground shadow-md hover:shadow-lg" : "border border-border bg-secondary hover:border-muted-foreground"
      }`}
    >
      {/* A wash that rises over the button on hover and deepens as it presses. */}
      <View
        class={`absolute inset-0 rounded-full opacity-0 translate-y-full ${LAYER} group-hover:translate-y-0 group-hover:opacity-10 group-active:opacity-20 group-disabled:opacity-0 ${
          primary() ? "bg-background" : "bg-foreground"
        }`}
      />
      <Text class={`text-sm font-bold ${LAYER} group-active:scale-95 ${primary() ? "text-background" : "text-foreground"}`}>{props.label}</Text>
    </Button>
  );
}

/** A quiet text button for a link that leaves the app (the `link` role). */
export function TextLink(props: { label: string; onPress: () => void; small?: boolean; class?: string }) {
  return (
    <Button
      role="link"
      onPress={props.onPress}
      class={`group self-start rounded-sm ${LAYER} hover:-translate-y-px active:translate-y-0 active:opacity-60 ${focusRing} ${props.class ?? ""}`}
    >
      <Text class={`font-semibold text-primary hover:underline ${props.small ? "text-xs" : "text-sm"}`}>{props.label}</Text>
    </Button>
  );
}

/** An item's image, square (or round for an artist), with a glyph while it
 * has none. Sized by `size` (points) or by `class` (`w-full max-w-52`). In a
 * terminal it takes no Cells. `liked` is Liked Songs' own cover, a red heart
 * tile, in place of Spotify's artwork. */
export function Cover(props: {
  src: string;
  size?: number;
  round?: boolean;
  liked?: boolean;
  fallback?: IconName;
  class?: string;
}) {
  if (terminal) return <View class="hidden" />;
  const glyph = () => (props.size ? Math.max(16, props.size * 0.42) : 72);
  return (
    <View
      class={`shrink-0 items-center justify-center overflow-hidden ${props.liked ? "bg-liked" : "bg-secondary"} ${
        props.round ? "rounded-full" : "rounded-md"
      } ${props.size ? "" : "aspect-square w-full"} ${props.class ?? ""}`}
      style={props.size ? { width: props.size, height: props.size } : {}}
    >
      <Icon
        name={props.liked ? "heartFilled" : (props.fallback ?? "music")}
        size={props.liked ? glyph() : props.size ? Math.max(16, props.size * 0.4) : 40}
        color={props.liked ? "liked-foreground" : "muted-foreground"}
      />
      <If when={props.src && !props.liked}>
        <Image src={imageFor(props.src, props.size)} accessibilityElementsHidden class="absolute inset-0 object-cover" />
      </If>
    </View>
  );
}

/** A slider (position, volume): a track with a filled range and a thumb
 * that shows on hover, focus and drag. */
export function BarSlider(props: {
  label: string;
  value: number;
  max: number;
  disabled?: boolean;
  /** The range in the colour of what plays (`state/tint`). */
  tinted?: boolean;
  class?: string;
  onChange: (value: number) => void;
  onChangeEnd: (value: number) => void;
}) {
  return (
    <Slider
      accessibilityLabel={props.label}
      value={props.value}
      min={0}
      max={props.max}
      step={0}
      disabled={props.disabled ?? false}
      class={props.class}
      trackClass="group h-5 justify-center"
      // The range fills the track, so both share one centre line.
      indicatorClass={`h-1.5 rounded-full bg-foreground/12 ${LAYER} group-hover:h-2 group-active:h-2`}
      rangeClass="h-full rounded-full bg-foreground/55 disabled:bg-muted-foreground"
      // No thumb dot: the bar itself is the control (it still takes the
      // keyboard focus and screen readers through the slider).
      thumbClass="size-0 opacity-0"
      rangeStyle={
        props.tinted && !props.disabled
          ? { backgroundImage: `linear-gradient(90deg, ${alpha(tint(), 0.3)}, ${alpha(tint(), 0.6)})` }
          : undefined
      }
      onChange={({ value }) => typeof value === "number" && props.onChange(value)}
      onChangeEnd={({ value }) => typeof value === "number" && props.onChangeEnd(value)}
    />
  );
}

/** A section's title. */
export function SectionTitle(props: { children: JSX.Element; class?: string }) {
  return (
    <Text role="header" class={`text-xl font-bold text-foreground ${props.class ?? ""}`}>
      {props.children}
    </Text>
  );
}
