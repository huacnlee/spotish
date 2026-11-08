// Motion helpers over NSH's native animation system. These are the app's
// showcase motions, so they play even when the system asks for reduced motion
// (ignoreReduceMotion) — the point of the app is to show NSH's native motion.
// Press/hover feedback elsewhere still honors motion-reduce via classes.

import { Animated, type CompositeAnimation, createMotion, type MotionName } from "nsh";

/** A style that plays `preset` once when the view mounts; spread into `style`. */
export function enter(preset: MotionName = "fadeInUp", delay = 0) {
  return createMotion({ enter: preset, delay, ignoreReduceMotion: true }).style;
}

/** A looping motion (e.g. "breathe", "float", "glow") you start and stop. */
export function looping(preset: MotionName) {
  const motion = createMotion({ ignoreReduceMotion: true });
  let anim: CompositeAnimation | undefined;
  return {
    style: motion.style,
    start() {
      if (anim) return;
      anim = Animated.loop(motion.animation(preset));
      anim.start();
    },
    stop() {
      anim?.stop();
      anim = undefined;
      motion.reset();
    },
  };
}
