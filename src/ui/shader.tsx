// A refined ambient shader: a single track-hue glow settling into the dark,
// slow and desaturated rather than a clash of colors — plus a little dither so
// the dark gradient has no banding. NSH drawing live WGSL under native views.

import { Shader, View } from "nsh";

const AURORA = /* wgsl */ `
struct Uniforms { a: vec4f, b: vec4f, c: vec4f, intensity: f32 }
fn hash(p: vec2f) -> f32 {
  let q = bitcast<vec2u>(vec2i(floor(p)));
  var h = (q.x * 1597334677u) ^ (q.y * 3812015801u);
  h = h * 1664525u + 1013904223u;
  h = (h ^ (h >> 16u)) * 2246822519u;
  return f32((h ^ (h >> 13u)) >> 8u) / 16777216.0;
}
fn bloom(p: vec2f, center: vec2f, size: f32) -> f32 {
  let d = p - center;
  return exp(-dot(d, d) / (size * size));
}
fn shade(uv: vec2f) -> vec4f {
  let aspect = vec2f(nsh.size.x / max(nsh.size.y, 1.0), 1.0);
  let p = uv * aspect;
  let t = nsh.time * 0.12;
  // One broad wash near the top, two gentle same-hue blooms drifting under it.
  let top = pow(clamp(1.0 - uv.y * 1.25, 0.0, 1.0), 1.6);
  var light = uniforms.a.rgb * top * 0.9;
  light += uniforms.b.rgb * bloom(p, vec2f(0.30 + 0.10 * sin(t), 0.10) * aspect, 0.55) * 0.5;
  light += uniforms.c.rgb * bloom(p, vec2f(0.74 + 0.09 * cos(t * 0.8), 0.18) * aspect, 0.55) * 0.4;
  let base = vec3f(0.015, 0.015, 0.02);
  var color = base + light * uniforms.intensity;
  // Filmic roll-off keeps highlights soft instead of flat clipping.
  color = color / (color + vec3f(0.85));
  // Ordered-ish dither removes banding on the dark gradient.
  color += (hash(uv * nsh.size * nsh.scale) - 0.5) / 160.0;
  return vec4f(color, 1.0);
}`;

/** Hue (0..1), saturation, lightness → `#rrggbb`. */
function hsl(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * v).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** A cohesive single-hue palette from a track URI: one base hue, muted, in
 * three closely related tones (not a rainbow). */
export function colorsFor(uri: string): [string, string, string] {
  let hash = 0;
  for (let i = 0; i < uri.length; i++) hash = (hash * 31 + uri.charCodeAt(i)) >>> 0;
  const base = uri ? (hash % 360) / 360 : 0.41; // default: a Spotify-ish green
  // Same hue family, gently shifted, low saturation and lightness → classy.
  return [hsl(base, 0.5, 0.42), hsl((base + 0.04) % 1, 0.45, 0.34), hsl((base + 0.92) % 1, 0.4, 0.3)];
}

/** `#rrggbb` → [h(0..1), s, l]. */
function hexToHsl(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255,
    g = ((n >> 8) & 255) / 255,
    b = (n & 255) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  const l = (max + min) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return [h, s, l];
}

/** The ambient palette for the current track: derived from the cover's own
 * extracted color when available, else a stable hue from its URI. */
export function coverColors(hex: string, uri: string): [string, string, string] {
  const hsv = hexToHsl(hex);
  if (!hsv) return colorsFor(uri);
  const [h] = hsv;
  // Keep the cover's hue; set tasteful, dark, cohesive tones for the shader.
  const s = Math.min(0.55, Math.max(0.28, hsv[1]));
  return [hsl(h, s, 0.42), hsl((h + 0.03) % 1, s * 0.9, 0.33), hsl((h + 0.92) % 1, s * 0.8, 0.28)];
}

/** The aurora, tinted by `colors`, under `children`. */
export function Ambient(props: { colors: () => [string, string, string]; children?: JSX.Element }) {
  return (
    <View class="flex-1">
      <Shader
        source={AURORA}
        uniforms={{ a: props.colors()[0], b: props.colors()[1], c: props.colors()[2], intensity: 1.15 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {props.children}
    </View>
  );
}
