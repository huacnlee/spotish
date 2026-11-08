// The Spotish mark: a pair of beamed eighth notes (🎵) on a glossy green key.
// Rendered as an SVG data-URI through <Image> (TSX has no inline-SVG element).
// The same mark is the website's favicon (website/public/favicon.svg).

import { Image } from "nsh";

const INK = "#04130a";

/** The logo SVG at `size` points: a rounded square in a light-to-deep green
 * gradient with a soft top gloss, and a near-black pair of beamed notes. */
export function logoMarkup(size = 32): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">\
<defs>\
<linearGradient id="t" x1="0" y1="0" x2="1" y2="1">\
<stop offset="0" stop-color="#5ff08f"/><stop offset="0.5" stop-color="#1ed760"/><stop offset="1" stop-color="#14833b"/>\
</linearGradient>\
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1">\
<stop offset="0" stop-color="#ffffff" stop-opacity="0.32"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>\
</linearGradient>\
</defs>\
<rect width="32" height="32" rx="8" fill="url(#t)"/>\
<path d="M8 0h16a8 8 0 0 1 8 8v4.5C24 15.5 8 15.5 0 12.5V8a8 8 0 0 1 8-8z" fill="url(#s)"/>\
<g fill="${INK}">\
<ellipse cx="10.6" cy="22.2" rx="3.6" ry="2.8" transform="rotate(-20 10.6 22.2)"/>\
<ellipse cx="21.6" cy="20.2" rx="3.6" ry="2.8" transform="rotate(-20 21.6 20.2)"/>\
<rect x="12.6" y="9.6" width="2" height="12.6"/>\
<rect x="23.6" y="7.6" width="2" height="12.6"/>\
<path d="M12.6 9.6L25.6 7.2V10.8L12.6 13.2Z"/>\
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
