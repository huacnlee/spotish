// The Spotish mark: a pair of beamed sixteenth notes on a green key with
// faint record grooves, in the theme's own green (the colour of its links).
// Rendered as an SVG data-URI through <Image> (TSX has no inline-SVG element).
// The website's favicon (website/public/favicon.svg) is the same mark.

import { colorScheme, Image, token } from "nsh";
import { shade } from "../state/tint";

const INK = "#071002";
/** The green when there is no theme to ask (the favicon's). */
export const LOGO_GREEN = "#5da602";

/** The logo SVG at `size` points, in `green`: a rounded square from a light
 * to a deep shade of it with a soft top gloss, two faint grooves round the
 * middle, and near-black beamed notes with a glint on each head, centred by
 * eye (the heads weigh the mark down, so it sits a little high). */
export function logoMarkup(size = 32, green = LOGO_GREEN): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">\
<defs>\
<linearGradient id="t" x1="0" y1="0" x2="1" y2="1">\
<stop offset="0" stop-color="${shade(green, 0.14)}"/><stop offset="0.55" stop-color="${green}"/><stop offset="1" stop-color="${shade(green, -0.12)}"/>\
</linearGradient>\
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1">\
<stop offset="0" stop-color="#ffffff" stop-opacity="0.3"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>\
</linearGradient>\
</defs>\
<rect width="32" height="32" rx="8" fill="url(#t)"/>\
<path d="M8 0h16a8 8 0 0 1 8 8v4.5C24 15.5 8 15.5 0 12.5V8a8 8 0 0 1 8-8z" fill="url(#s)"/>\
<g fill="none" stroke="${INK}" stroke-opacity="0.13" stroke-width="0.7">\
<circle cx="16" cy="16" r="12.6"/><circle cx="16" cy="16" r="10.2"/>\
</g>\
<g transform="translate(-0.15 -0.7)">\
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
