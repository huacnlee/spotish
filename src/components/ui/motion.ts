// Motion over NSH's native animation: short entrances that explain where
// content came from. Every motion here honors the user's reduced-motion
// setting (NSH skips it then).

import { createMotion, type MotionName } from "nsh";

/** A style that plays `preset` once when the view mounts; spread it into
 * `style`. */
export function enter(preset: MotionName = "fadeInUp", delay = 0) {
  return createMotion({ enter: preset, delay }).style;
}
