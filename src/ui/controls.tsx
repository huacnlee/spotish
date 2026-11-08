// The app's styled controls, each wrapping a base component once. Screens
// compose these; they do not restyle base controls themselves.

import type { JSX } from "nsh";
import { Image, platform, View } from "nsh";
import { Button, Slider } from "nsh/base";
import { Icon, type IconName } from "./icons";
import { accentHex } from "./accent";

/** A borderless icon button: muted, brighter on hover, primary while `on`. */
export function IconButton(props: {
  name: () => IconName;
  label: string;
  size?: number;
  on?: () => boolean;
  disabled?: () => boolean;
  onPress: () => void;
}) {
  const size = () => props.size ?? 18;
  // Icons bake their color in, so hover can't recolor them; instead the icon is
  // drawn full-strength and the button dims when idle, brightening on hover —
  // the Spotify feel, and it works with baked-in icon colors.
  const color = () => (props.on?.() ? accentHex() : "foreground");
  const tone = () => (props.on?.() ? "opacity-100" : "opacity-65 hover:opacity-100");
  return (
    <Button
      accessibilityLabel={props.label}
      disabled={props.disabled?.() ?? false}
      onPress={props.onPress}
      class={`relative items-center justify-center rounded-full transition duration-150 ease-out hover:scale-110 active:scale-90 disabled:opacity-30 disabled:hover:scale-100 motion-reduce:transition-none motion-reduce:hover:scale-100 focus:outline focus:outline-2 focus:outline-ring ${tone()}`}
      style={{ width: size() + 14, height: size() + 14 }}
    >
      <Icon name={props.name()} size={size()} color={color()} />
      {/* A small dot marks an active toggle (shuffle / repeat), as Spotify does. */}
      <If when={props.on?.() ?? false}>
        <View class="absolute bottom-0.5 size-1 rounded-full" style={{ backgroundColor: accentHex() }} />
      </If>
    </Button>
  );
}

/** The round play / pause button, `size` across. */
export function PlayButton(props: {
  playing: () => boolean;
  size?: number;
  primary?: boolean;
  disabled?: () => boolean;
  onPress: () => void;
}) {
  const size = () => props.size ?? 36;
  const primary = () => props.primary ?? false;
  return (
    <Button
      accessibilityLabel={props.playing() ? "Pause" : "Play"}
      disabled={props.disabled?.() ?? false}
      onPress={props.onPress}
      class={`items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 active:scale-95 active:opacity-85 disabled:opacity-40 motion-reduce:transition-none motion-reduce:hover:scale-100 focus:outline focus:outline-2 focus:outline-ring ${primary() ? "" : "bg-control"}`}
      style={primary() ? { width: size(), height: size(), backgroundColor: accentHex() } : { width: size(), height: size() }}
    >
      <Icon
        name={props.playing() ? "pause" : "play"}
        size={size() * 0.42}
        color={primary() ? "#ffffff" : "control-foreground"}
      />
    </Button>
  );
}

/** A pill button with a label: `primary` filled, else outlined. */
export function PillButton(props: { label: string; primary?: boolean; onPress: () => void }) {
  const primary = () => props.primary ?? false;
  return (
    <Button
      onPress={props.onPress}
      class={`h-9 items-center justify-center rounded-full px-5 hover:scale-105 active:opacity-70 focus:outline focus:outline-2 focus:outline-ring ${
        primary() ? "bg-foreground" : "border border-muted-foreground"
      }`}
    >
      <TextLabel bold class={primary() ? "text-background text-sm" : "text-foreground text-sm"}>
        {props.label}
      </TextLabel>
    </Button>
  );
}

// A tiny text helper so controls don't each import Text; screens use <Text> directly.
import { Text } from "nsh";
function TextLabel(props: { bold?: boolean; class?: string; children: JSX.Element }) {
  return <Text class={`${props.bold ? "font-bold" : ""} ${props.class ?? ""}`}>{props.children}</Text>;
}

/** Whether the app is drawn in a terminal (no images; text-first layout). */
export const isTerminal = platform.idiom === "terminal";

/** An item's image, square (or round for an artist), with a glyph fallback. */
export function Cover(props: {
  src: () => string;
  size?: number;
  round?: boolean;
  fallback?: IconName;
  class?: string;
}) {
  const round = () => props.round ?? false;
  // A terminal can't draw images. A sized cover becomes a small glyph; a card's
  // full-width cover collapses so it doesn't leave a tall empty box.
  if (isTerminal) {
    if (!props.size) return <View class="hidden" />;
    return (
      <View class={`shrink-0 items-center justify-center text-muted-foreground ${props.class ?? ""}`} style={{ width: props.size, height: Math.min(props.size, 22) }}>
        <Icon name={props.fallback ?? "music"} size={16} color="muted-foreground" />
      </View>
    );
  }
  return (
    <View
      class={`shrink-0 items-center justify-center overflow-hidden bg-secondary text-muted-foreground ${
        round() ? "rounded-full" : "rounded-md"
      } ${props.size ? "" : "aspect-square w-full"} ${props.class ?? ""}`}
      style={props.size ? { width: props.size, height: props.size } : {}}
    >
      <Icon name={props.fallback ?? "music"} size={props.size ? Math.max(16, props.size * 0.4) : 40} color="muted-foreground" />
      <If when={props.src()}>
        <Image
          src={props.src()}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          class="object-cover"
        />
      </If>
    </View>
  );
}

/** A thin bar slider (progress, volume): range in the text color, thumb on hover. */
export function BarSlider(props: {
  label: string;
  value: () => number;
  max: () => number;
  disabled?: () => boolean;
  class?: string;
  onChange: (v: number) => void;
  onChangeEnd: (v: number) => void;
}) {
  return (
    <Slider
      accessibilityLabel={props.label}
      value={props.value()}
      min={0}
      max={props.max()}
      step={0}
      disabled={props.disabled?.() ?? false}
      class={props.class}
      trackClass="h-4 justify-center group"
      indicatorClass="h-1 rounded-full bg-muted"
      rangeClass="rounded-full"
      rangeStyle={{ backgroundColor: accentHex() }}
      thumbClass="size-3 rounded-full bg-foreground opacity-0 group-hover:opacity-100 active:opacity-100 focus:opacity-100"
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
