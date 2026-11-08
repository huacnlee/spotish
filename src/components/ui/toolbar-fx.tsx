// The player's glass: Liquid Glass drawn by a shader for every system. It
// reads what is behind it and bends it at the rim like a lens (splitting
// its colours a little there), frosts it, darkens it toward the player's
// colour so the controls stay legible, and catches light on its rim. Over
// it, in a layer of its own, the music's light (an effect in the cover's
// colours, src/platform/audio.ts); the controls are drawn on top as they
// are. The glass's uniforms hold still, so it is drawn again only when what
// is behind it changes: the music redraws only the cheap light.
//
// Every effect is `fn effect(p: vec2f, uv: vec2f) -> f32`, the light's
// strength (0..1) at `p` (points in the surface). Without metering (other
// systems, the demo) effects run at a resting level; paused, they hold
// still; with reduced motion they rest. In a terminal: a plain box.

import { type JSX, reduceMotion, Shader, ShaderEffect, token, View } from "nsh";
import { audioLevels } from "../../platform/audio";
import { alpha } from "../../state/tint";
import { terminal } from "./controls";

const HEAD = /* wgsl */ `
struct Uniforms {
  c0: vec4f,
  c1: vec4f,
  c2: vec4f,
  c3: vec4f,
  base: vec4f,
  b0: vec4f,
  b1: vec4f,
  b2: vec4f,
  b3: vec4f,
  beat: f32,
  level: f32,
  bass: f32,
  mid: f32,
  treble: f32,
  strength: f32,
  radius: f32,
  reach: f32,
  // How far the colours have travelled along the light (0..1, wrapping).
  phase: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
}

fn band(i: i32) -> f32 {
  let k = clamp(i, 0, 15);
  let v = select(select(select(uniforms.b3, uniforms.b2, k < 12), uniforms.b1, k < 8), uniforms.b0, k < 4);
  let j = k % 4;
  return select(select(select(v.w, v.z, j < 3), v.y, j < 2), v.x, j < 1);
}

// The spectrum at x in 0..1, smooth between bands.
fn spectrum(x: f32) -> f32 {
  let s = clamp(x, 0.0, 1.0) * 15.0;
  let i = i32(floor(s));
  let f = fract(s);
  return mix(band(i), band(i + 1), f * f * (3.0 - 2.0 * f));
}

// The surface's shape: a rounded box of corner radius (a pill when the
// radius is half its height or more).
fn pill(p: vec2f) -> f32 {
  let r = min(uniforms.radius, nsh.size.y * 0.5);
  let c = nsh.size * 0.5;
  let q = abs(p - c) - (c - vec2f(r, r));
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

fn vivid(c: vec3f) -> vec3f {
  let hi = max(max(c.r, c.g), c.b);
  let lo = min(min(c.r, c.g), c.b);
  let chroma = smoothstep(0.03, 0.2, hi - lo);
  let pure = (c - vec3f(lo)) / max(hi - lo, 0.001);
  return mix(vec3f(0.85), mix(vec3f(0.3), vec3f(1.0), pure), chroma);
}
`;

// The light's colour, held in a band of brightness: the cover's hue, never
// so bright that the controls over it lose their contrast.
const TAME = /* wgsl */ `
fn tame(c: vec3f) -> vec3f {
  let v = vivid(c);
  let lum = dot(v, vec3f(0.2126, 0.7152, 0.0722));
  return clamp(v * (0.32 / max(lum, 0.05)), vec3f(0.0), vec3f(0.9));
}
`;

// The glass alone: what is behind, bent at the rim and frosted, darkened
// toward the player's colour, a one-pixel rim catching the light. Its
// uniforms hold still, so it draws again only when what is behind it
// changes (a scroll), never with the music.
const GLASS = /* wgsl */ `${HEAD}
fn normal_at(p: vec2f) -> vec2f {
  let e = 0.75;
  let g = vec2f(pill(p + vec2f(e, 0.0)) - pill(p - vec2f(e, 0.0)), pill(p + vec2f(0.0, e)) - pill(p - vec2f(0.0, e)));
  return g / max(length(g), 0.0001);
}

// What is behind, frosted: a small golden-angle disc of taps around p.
fn frost(p: vec2f) -> vec3f {
  var sum = vec3f(0.0);
  for (var i = 0; i < 8; i = i + 1) {
    let f = f32(i);
    let r = sqrt((f + 0.5) / 8.0) * 5.0;
    let a = f * 2.39996;
    sum = sum + sample_backdrop((p + vec2f(cos(a), sin(a)) * r) / nsh.size).rgb;
  }
  return sum / 8.0;
}

fn shade(uv: vec2f) -> vec4f {
  let p = uv * nsh.size;
  let d = pill(p);
  let cover = clamp(0.5 - d, 0.0, 1.0);
  if (cover <= 0.0) {
    return vec4f(0.0);
  }
  let depth = -d;
  let bevel = min(nsh.size.y * 0.15, 7.0);
  let rim = clamp(1.0 - depth / bevel, 0.0, 1.0);
  let n = normal_at(p);

  // The lens: toward the rim the backdrop is drawn in from beyond it, its
  // colours split a little.
  let at = p - n * pow(rim, 2.5) * 6.0;
  let split = n * pow(rim, 3.0) * 0.8;
  var col = vec3f(frost(at + split).r, frost(at).g, frost(at - split).b);

  // The glass body: toward the player's colour, so the controls read.
  col = mix(col, uniforms.base.rgb, uniforms.base.a);

  // The rim: a one-pixel line, bright where it faces the light (above, a
  // little left), fainter below.
  let facing = dot(n, normalize(vec2f(-0.3, -1.0)));
  let line = clamp(1.0 - depth * nsh.scale, 0.0, 1.0);
  col = col + line * (0.06 + 0.30 * max(facing, 0.0) + 0.06 * max(-facing, 0.0));
  let noise = (fract(52.9829189 * fract(dot(p * nsh.scale, vec2f(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  return vec4f(clamp(col + noise, vec3f(0.0), vec3f(1.0)), cover);
}
`;

// Light rising from the bottom edge, the spectrum mirrored from the centre.
const SPECTRUM = /* wgsl */ `
fn effect(p: vec2f, uv: vec2f) -> f32 {
  // Mirrored from the centre (the bass in the middle), sharpened so loud
  // bands stand up as crests over the quiet ones.
  let v = pow(spectrum(abs(uv.x - 0.5) * 2.0), 1.5);
  let up = nsh.size.y - p.y;
  let crest = 2.0 + uniforms.reach * v + 4.0 * uniforms.beat;
  // The body under the crest fades upward; the crest itself is a bright line.
  let body = smoothstep(crest + 2.0, crest - 3.0, up) * (0.15 + 0.45 * v) * (0.4 + 0.6 * (1.0 - up / max(crest, 1.0)));
  let line = exp(-pow((up - crest) / 1.1, 2.0)) * (0.35 + 0.65 * v);
  // Fade at the rounded ends, so nothing meets the border edge-on.
  let ends = smoothstep(0.0, 0.08, uv.x) * smoothstep(1.0, 0.92, uv.x);
  return (body + line) * ends * (0.5 + 0.5 * uniforms.level);
}

// Three of the cover's colours in a loop that travels along the light
// (the phase), so they change places as the music plays.
fn tint(p: vec2f, uv: vec2f) -> vec3f {
  let q = fract(uv.x * 0.75 + uniforms.phase) * 3.0;
  let f = smoothstep(0.0, 1.0, fract(q));
  let i = i32(floor(q));
  let a = select(select(uniforms.c2.rgb, uniforms.c1.rgb, i == 1), uniforms.c0.rgb, i == 0);
  let b = select(select(uniforms.c0.rgb, uniforms.c2.rgb, i == 1), uniforms.c1.rgb, i == 0);
  return mix(a, b, f);
}
`;

// The music's light alone: nothing read from behind, so drawing it with
// every change of the music costs little at any size. Kept inside the
// surface's shape, a pixel in from its rim.
const LIGHT_TAIL = /* wgsl */ `
${TAME}
fn shade(uv: vec2f) -> vec4f {
  let p = uv * nsh.size;
  let inside = clamp(-0.5 - pill(p) * nsh.scale, 0.0, 1.0);
  let light = clamp(effect(p, uv), 0.0, 1.0) * uniforms.strength * inside;
  let noise = (fract(52.9829189 * fract(dot(p * nsh.scale, vec2f(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  return vec4f(tame(tint(p, uv)), clamp(light + noise * inside, 0.0, 0.55));
}
`;

/** The lights, by name: each is the body of `effect` and `tint`. */
const LIGHTS = {
  spectrum: /* wgsl */ `${HEAD}${SPECTRUM}${LIGHT_TAIL}`,
} as const;

export type ToolbarEffect = keyof typeof LIGHTS;

/** How many of the cover's colours each effect uses (up to four). */
const COLORS: Record<ToolbarEffect, number> = { spectrum: 3 };
export const TOOLBAR_EFFECTS = Object.keys(LIGHTS) as ToolbarEffect[];

/** Every uniform of HEAD's struct: the music's (live, resting, or still)
 * and the colours, for `effect`. Call in a component's body. */
function lightUniforms(props: { effect: ToolbarEffect; colors: string[]; playing: boolean }) {
  const audio = audioLevels();
  // Without metering, a resting level keeps the light alive.
  const live = () => audio().level > 0.02;
  const on = () => props.playing && !reduceMotion();
  const bands = (from: number) => {
    const b = on() && live() ? audio().bands : [];
    const rest = on() && !live() ? 0.35 : 0;
    return [b[from] ?? rest, b[from + 1] ?? rest, b[from + 2] ?? rest, b[from + 3] ?? rest];
  };
  const value = (v: number, rest: number) => (!on() ? 0 : live() ? v : rest);
  // The colours travel with the music: read as the levels change (about 60
  // a second while it plays), so it costs no frames of its own.
  const phase = () => (on() ? (audio(), (Date.now() / 1000 / 24) % 1) : 0);
  const palette = () => {
    const given = props.colors.length ? props.colors : [String(token("primary"))];
    const n = COLORS[props.effect];
    const at = (i: number) => given[Math.min(i, n - 1) % given.length];
    return { c0: at(0), c1: at(1), c2: at(2), c3: at(3) };
  };
  return {
    on,
    uniforms: (extra: { strength: number; radius: number; reach: number }) => ({
      ...palette(),
      base: "#00000000",
      b0: bands(0),
      b1: bands(4),
      b2: bands(8),
      b3: bands(12),
      beat: value(audio().beat, 0),
      level: value(audio().level, 0.4),
      bass: value(audio().bass, 0.3),
      mid: value(audio().mid, 0.3),
      treble: value(audio().treble, 0.3),
      ...extra,
      phase: phase(),
      pad0: 0,
      pad1: 0,
      pad2: 0,
    }),
  };
}

/** HEAD's uniforms held still, for the glass (it reads only `base` and
 * `radius`). */
function stillUniforms(base: string, radius: number) {
  const zero = [0, 0, 0, 0];
  return {
    c0: "#000000", c1: "#000000", c2: "#000000", c3: "#000000",
    base,
    b0: zero, b1: zero, b2: zero, b3: zero,
    beat: 0, level: 0, bass: 0, mid: 0, treble: 0,
    strength: 0, radius, reach: 0, phase: 0, pad0: 0, pad1: 0, pad2: 0,
  };
}

/** The player's glass behind `children`, filling its box (`class` gives
 * size, padding and layout): a pill by default, or a box of corner
 * `radius` points. Three layers: the glass (redrawn only when what is
 * behind it changes), the music's light over it (cheap, with the music),
 * and the controls on top, drawn as they are. */
export function PlayerGlass(props: {
  effect: ToolbarEffect;
  /** The cover's colours, most telling first; an effect takes the first it
   * needs, repeating them when the cover has fewer. */
  colors: string[];
  playing: boolean;
  radius?: number;
  class?: string;
  testID?: string;
  children: JSX.Element;
}) {
  if (terminal) return <View class={props.class}>{props.children}</View>;
  const light = lightUniforms(props);
  const radius = () => props.radius ?? 9999;
  return (
    <View testID={props.testID} class={`relative ${props.class ?? ""}`}>
      <ShaderEffect
        source={GLASS}
        accessibilityElementsHidden
        maxSampleOffset={12}
        class="absolute inset-0"
        // The player's colour over nearly all of what shows through: the
        // pages behind only tint the glass, they don't move in it.
        uniforms={stillUniforms(alpha(String(token("player")), 0.9), radius())}
      >
        <View class="flex-1" />
      </ShaderEffect>
      <Shader
        source={LIGHTS[props.effect]}
        accessibilityElementsHidden
        paused={!light.on()}
        class="absolute inset-0"
        uniforms={light.uniforms({ strength: 0.6, radius: radius(), reach: 40 })}
      />
      {props.children}
    </View>
  );
}

/** The music's light along the bottom of its parent (`absolute`, first
 * child), the crests reaching up to `reach` points. Only that strip is
 * drawn: the rest of the page costs nothing. */
export function MusicLight(props: { effect: ToolbarEffect; colors: string[]; playing: boolean; reach: number }) {
  if (terminal) return <View class="hidden" />;
  const light = lightUniforms(props);
  return (
    <Shader
      source={LIGHTS[props.effect]}
      accessibilityElementsHidden
      paused={!light.on()}
      class="absolute inset-x-0 bottom-0"
      style={{ height: Math.ceil(props.reach + 24) }}
      uniforms={light.uniforms({ strength: 0.7, radius: 0, reach: props.reach })}
    />
  );
}
