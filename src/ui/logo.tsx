// The Spotish mark: a pair of beamed sixteenth notes on a green squircle
// (a superellipse, the corners easing in continuously), in the theme's own
// green (the colour of its links).
// Rendered as an SVG data-URI through <Image> (TSX has no inline-SVG element).
// The website's favicon (website/public/favicon.svg) is the same mark.

import { colorScheme, Image, token } from "nsh";
import { shade } from "../state/tint";

const INK = "#071002";
/** The squircle: a superellipse of exponent 3 filling the 32-unit box
 * (round corners, still continuous). */
const SQUIRCLE = "M32.00 16.00L31.98 18.60L31.91 20.12L31.79 21.38L31.63 22.50L31.43 23.51L31.18 24.43L30.88 25.29L30.54 26.08L30.15 26.81L29.71 27.49L29.23 28.12L28.70 28.70L28.12 29.23L27.49 29.71L26.81 30.15L26.08 30.54L25.29 30.88L24.43 31.18L23.51 31.43L22.50 31.63L21.38 31.79L20.12 31.91L18.60 31.98L16.00 32.00L13.40 31.98L11.88 31.91L10.62 31.79L9.50 31.63L8.49 31.43L7.57 31.18L6.71 30.88L5.92 30.54L5.19 30.15L4.51 29.71L3.88 29.23L3.30 28.70L2.77 28.12L2.29 27.49L1.85 26.81L1.46 26.08L1.12 25.29L0.82 24.43L0.57 23.51L0.37 22.50L0.21 21.38L0.09 20.12L0.02 18.60L0.00 16.00L0.02 13.40L0.09 11.88L0.21 10.62L0.37 9.50L0.57 8.49L0.82 7.57L1.12 6.71L1.46 5.92L1.85 5.19L2.29 4.51L2.77 3.88L3.30 3.30L3.88 2.77L4.51 2.29L5.19 1.85L5.92 1.46L6.71 1.12L7.57 0.82L8.49 0.57L9.50 0.37L10.62 0.21L11.88 0.09L13.40 0.02L16.00 0.00L18.60 0.02L20.12 0.09L21.38 0.21L22.50 0.37L23.51 0.57L24.43 0.82L25.29 1.12L26.08 1.46L26.81 1.85L27.49 2.29L28.12 2.77L28.70 3.30L29.23 3.88L29.71 4.51L30.15 5.19L30.54 5.92L30.88 6.71L31.18 7.57L31.43 8.49L31.63 9.50L31.79 10.62L31.91 11.88L31.98 13.40Z";
/** The green when there is no theme to ask (the favicon's). */
export const LOGO_GREEN = "#5da602";

/** The logo SVG at `size` points, in `green`: a rounded square from a light
 * to a deep shade of it with a soft top gloss, and near-black beamed notes
 * with a glint on each head, centred by eye: the heads weigh it down and
 * the beam right, so it sits a little high and to the left. */
export function logoMarkup(size = 32, green = LOGO_GREEN): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">\
<defs>\
<linearGradient id="t" x1="0" y1="0" x2="1" y2="1">\
<stop offset="0" stop-color="${shade(green, 0.14)}"/><stop offset="0.55" stop-color="${green}"/><stop offset="1" stop-color="${shade(green, -0.12)}"/>\
</linearGradient>\
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1">\
<stop offset="0" stop-color="#ffffff" stop-opacity="0.3"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>\
</linearGradient>\
<clipPath id="k"><path d="${SQUIRCLE}"/></clipPath>\
</defs>\
<path d="${SQUIRCLE}" fill="url(#t)"/>\
<path clip-path="url(#k)" d="M0 0H32V12.5C24 15.5 8 15.5 0 12.5Z" fill="url(#s)"/>\
<g transform="translate(-1.3 -0.7)">\
<g fill="${INK}">\
<ellipse cx="11" cy="22.4" rx="3.4" ry="2.6" transform="rotate(-20 11 22.4)"/>\
<ellipse cx="21.4" cy="20.4" rx="3.4" ry="2.6" transform="rotate(-20 21.4 20.4)"/>\
<rect x="12.5" y="10" width="1.9" height="12.3"/>\
<rect x="22.9" y="8" width="1.9" height="12.3"/>\
<path d="M12.5 10L24.8 7.6V10.6L12.5 13Z"/>\
<path d="M12.5 15L24.8 12.6V14.8L12.5 17.2Z"/>\
</g>\
<g fill="#ffffff" fill-opacity="0.28">\
<ellipse cx="9.9" cy="21.5" rx="1.2" ry="0.6" transform="rotate(-20 9.9 21.5)"/>\
<ellipse cx="20.3" cy="19.5" rx="1.2" ry="0.6" transform="rotate(-20 20.3 19.5)"/>\
</g>\
</g></svg>`;
}

/** The Spotish logo, `size` points square, in the theme's green (tracked:
 * it follows the theme). */
export function Logo(props: { size?: number }) {
  const size = () => props.size ?? 32;
  const green = () => {
    colorScheme();
    const t = String(token("primary"));
    return /^#[0-9a-f]{6}/i.test(t) ? t.slice(0, 7) : LOGO_GREEN;
  };
  return (
    <Image
      src={`data:image/svg+xml,${encodeURIComponent(logoMarkup(size(), green()))}`}
      style={{ width: size(), height: size() }}
    />
  );
}
