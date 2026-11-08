// The app's live accent: the color of the playing cover. The whole UI tints
// from it — the backdrop shader, the play button, progress, active states —
// so Spotish takes on the color of the music instead of a fixed brand hue.

import { resource } from "nsh";
import { store } from "./store";
import { coverColors } from "./shader";

const VIOLET = "#7c5cff";

const tint = resource(
  () => store.player().artwork,
  async (url) => (url ? ((await store.spotify.colors(url)) as { hex: string }).hex : ""),
);

/** The accent hex — the cover's extracted color, a vivid violet before a cover. */
export function accentHex(): string {
  const h = tint();
  return h && /^#?[0-9a-f]{6}$/i.test(h) ? h : VIOLET;
}

/** The three shader tones for the current cover. */
export function accentColors(): [string, string, string] {
  return coverColors(tint() || VIOLET, store.player().trackUri);
}
