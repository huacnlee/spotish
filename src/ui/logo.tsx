// The Spotish mark: the app's own music glyph on a green NSH-style tile.
// Rendered as an SVG data-URI through <Image> (TSX has no inline-SVG element).

import { Image } from "nsh";

const INK = "#0a1f12";

/** The logo SVG at `size` points. A beamed-notes glyph (the app's `music`
 * icon) on a rounded green tile — a music symbol in a clean geometric frame. */
export function logoMarkup(size = 32): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">\
<rect width="32" height="32" rx="8" fill="#1ed760"/>\
<g transform="translate(4 4)" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">\
<path d="M9 18V5l12-2v13"/>\
<circle cx="6" cy="18" r="3" fill="${INK}" stroke="none"/>\
<circle cx="18" cy="16" r="3" fill="${INK}" stroke="none"/>\
</g></svg>`;
}

/** The Spotish logo, `size` points square. */
export function Logo(props: { size?: number }) {
  const size = () => props.size ?? 32;
  return (
    <Image
      src={`data:image/svg+xml,${encodeURIComponent(logoMarkup(size()))}`}
      style={{ width: size(), height: size() }}
    />
  );
}
