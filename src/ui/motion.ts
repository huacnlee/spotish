// Motion helpers over NSH's native animation system. Entrance animations give
// content spatial continuity; looping motions bring Now Playing alive. All run
// on the native driver and honor reduced-motion automatically (createMotion
// lands at rest without moving when the user asks for less motion).

import { Animated, type CompositeAnimation, createMotion, type MotionName } from "nsh";

/** A style that plays `preset` once when the view mounts; spread into `style`. */
export function enter(preset: MotionName = "fadeInUp", delay = 0) {
  return createMotion({ enter: preset, delay }).style;
}

/** A looping motion (e.g. "breathe", "float", "glow") you start and stop. */
export function looping(preset: MotionName) {
  const motion = createMotion();
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
