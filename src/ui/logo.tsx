// The Spotish mark: a green tile with a blocky equalizer, echoing NSH's
// segmented look. Rendered as an SVG data-URI through <Image> (TSX has no
// inline-SVG element).

import { Image } from "nsh";

export function logoMarkup(size = 32): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">\
<rect width="32" height="32" rx="8" fill="#1ed760"/>\
<g fill="#0a1f12">\
<rect x="7" y="17" width="4.5" height="8" rx="1.2"/>\
<rect x="13.75" y="11" width="4.5" height="14" rx="1.2"/>\
<rect x="20.5" y="7" width="4.5" height="18" rx="1.2"/>\
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
