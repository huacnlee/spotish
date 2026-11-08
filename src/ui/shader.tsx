// A vivid, flowing "synth" backdrop: cover-tinted light that moves across a
// layered wave field, tonemapped and vignetted so it stays deep enough for
// glass panels and text to sit over it. NSH drawing live WGSL under native UI.

import type { JSX } from "nsh";
import { Shader, View } from "nsh";

const SYNTH = /* wgsl */ `
struct Uniforms { a: vec4f, b: vec4f, c: vec4f, intensity: f32 }
fn hash(p: vec2f) -> f32 {
  let q = bitcast<vec2u>(vec2i(floor(p)));
  var h = (q.x * 1597334677u) ^ (q.y * 3812015801u);
  h = h * 1664525u + 1013904223u;
  return f32((h ^ (h >> 13u)) >> 8u) / 16777216.0;
}
fn shade(uv: vec2f) -> vec4f {
  let aspect = vec2f(nsh.size.x / max(nsh.size.y, 1.0), 1.0);
  let p = (uv - 0.5) * aspect * 3.0;
  let t = nsh.time * 0.16;
  // A layered, slowly flowing scalar field.
  var v = sin(p.x * 1.1 + t) + sin(p.y * 1.3 - t * 0.8);
  v += sin((p.x + p.y) * 0.9 + t * 0.6) + sin(length(p) * 1.6 - t * 1.1);
  v *= 0.25;
  let m1 = 0.5 + 0.5 * sin(v * 3.14159 + t);
  let m2 = 0.5 + 0.5 * sin(v * 3.14159 + 2.2);
  var color = mix(uniforms.a.rgb, uniforms.b.rgb, m1);
  color = mix(color, uniforms.c.rgb, m2 * 0.6);
  color *= uniforms.intensity;
  // Filmic roll-off, a soft vignette, a deep base, and dither (no banding).
  color = color / (color + vec3f(0.55));
  let d = uv - vec2f(0.5, 0.42);
  color *= 1.0 - 0.7 * dot(d, d);
  color += vec3f(0.02, 0.02, 0.03);
  color += (hash(uv * nsh.size * nsh.scale) - 0.5) / 180.0;
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

/** A stable hue (0..1) from a track URI. */
function hueOf(uri: string): number {
  let hash = 0;
  for (let i = 0; i < uri.length; i++) hash = (hash * 31 + uri.charCodeAt(i)) >>> 0;
  return uri ? (hash % 360) / 360 : 0.72;
}

/** A vivid single-hue palette from a track URI (fallback). */
export function colorsFor(uri: string): [string, string, string] {
  const h = hueOf(uri);
  return [hsl(h, 0.7, 0.52), hsl((h + 0.07) % 1, 0.65, 0.4), hsl((h + 0.9) % 1, 0.6, 0.34)];
}

/** `#rrggbb` → [h, s, l]. */
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
    h = (h / 6 + 1) % 1;
  }
  const l = (max + min) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return [h, s, l];
}

/** The vivid palette for the current cover: derived from its extracted color
 * when available, else a stable hue from its URI. */
export function coverColors(hex: string, uri: string): [string, string, string] {
  const hsv = hexToHsl(hex);
  if (!hsv) return colorsFor(uri);
  const h = hsv[0];
  const s = Math.min(0.78, Math.max(0.45, hsv[1] + 0.15)); // push saturation for the synth look
  return [hsl(h, s, 0.52), hsl((h + 0.06) % 1, s * 0.92, 0.4), hsl((h + 0.9) % 1, s * 0.85, 0.33)];
}

/** The flowing synth backdrop, tinted by `colors`, under `children`. `intensity`
 * dials the glow (subtle app-wide, fuller for Now Playing). */
export function Ambient(props: {
  colors: () => [string, string, string];
  intensity?: number;
  children?: JSX.Element;
}) {
  return (
    <View class="flex-1">
      <Shader
        source={SYNTH}
        uniforms={{
          a: props.colors()[0],
          b: props.colors()[1],
          c: props.colors()[2],
          intensity: props.intensity ?? 1.2,
        }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {props.children}
    </View>
  );
}
