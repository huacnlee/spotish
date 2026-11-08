# Spotish design rules

The rules Spotish's interface keeps, collected from design reviews. They
apply on top of the [NSH Design Guides](https://nsh.dev/docs/design-guides.md);
where the two differ, these win for Spotish. Change them here first, then in
the code.

## Identity

- Spotish has its own look. It is not a Spotify clone and does not borrow
  Spotify's green for its controls.
- Dark and quiet. The window, the pages and Now Playing share the sidebar's
  near-black (`bg-sidebar`). No grey content panel. NSH's Linux NavStack
  paints its pages `#242424`, so every page is an `AppPage` (`src/components/page.tsx`), which covers that with the app's colour.
- No decorative gradients. In particular, no colour wash at the top of a
  page or of Now Playing: they read as dirty. The only colour that moves is
  the music light (below).

## Colour

- Theme colours come from tokens (`theme.json`, `src/platform/palette.ts`),
  never literals in components.
- Player controls are white (`foreground`), never solid: the play button,
  the seek and volume ranges, toggles that are on. Never
  green, never the cover's colour. A white control reads over any cover;
  a coloured one clashes (red cover, green button).
- Frosted, not solid: the player bar's white controls are translucent white
  with a fine border, so the light behind shows through.
- The play button over pictures (cards) is dark: a near-black, slightly
  translucent disc with a light glyph and a fine light border, which reads
  over any cover, light or dark.
- Liked is red (`liked` token), with a white heart on Liked Songs' cover.
- Menus and popovers are a solid, dark surface (`popover`, a step above the
  window), not a pale grey.

## The music light (shaders)

- The light comes from the cover. Extract a palette from it (up to eight
  colours, `coverColorsQuery`); each effect declares how many colours it uses
  and repeats them when the cover has fewer.
- Its brightness is controlled by an algorithm (`tame()` in
  `src/components/ui/toolbar-fx.tsx`): the hue is kept, the luminance is held
  near 0.32. The light must never be bright enough to hurt the contrast of
  the controls over it.
- It moves with the music, with crests: louder bands rise as peaks, the beat
  swells them. Every effect must have music-driven peaks. Edges are smooth
  (no hard top edge).
- It rests when nothing plays and when the user asks for less motion.
- Nothing may redraw every display frame without need. A shader that reads
  `nsh.time` repaints the whole window at the display's rate, so pause its
  clock whenever the music's levels drive it instead. The levels reach the
  visuals at about 60 frames a second (30 visibly stutters).
- Keep it cheap. Draw only where the light is (e.g. the bottom strip of Now
  Playing), never sample the backdrop on a full screen, and pause what is
  hidden. Now Playing must hold the display's refresh rate.

## The player bar (desktop)

- A pill floating over the right-hand pages, the sidebar fixed on the left.
  The pages scroll under it.
- Liquid Glass, drawn by a shader: refraction at the rim, frost, a body
  darkened toward the player colour for legibility, the music light inside.
  Not a gradient, not a sheen.
- Its border is a single 1px line that catches light. No glow on the border.
- The volume slider stays collapsed and opens on hover, focus or drag. Its
  thumb stays inside the bar at 0 and at 100%.

## Now Playing

- Full screen, the controls laid directly on the page. No floating card or
  glass panel.
- The music light is the page's background, rising from the bottom.
- A back chevron closes it.

## Controls

- Sliders: the range and the track share one centre line, and no thumb dot
  is drawn (the bar itself is the control). If a thumb ever returns, never
  scale it: NSH centres it with a transform that a scale replaces.
- The volume bar is short (about 64pt).
- Nested radii are concentric: inner radius = outer radius − gap
  (`--radius-card`, `--radius`, `--radius-inset`).
- Lists have a small gap between rows (4pt).
- Rows in one surface share one geometry: in the sidebar, every row (Home,
  Search, the library) is 44pt tall, padded 8pt, radius `--radius-inset`,
  its icon or cover in the same 30pt column, so labels line up. A panel's
  inset is the same on every side (8pt: a hovered row keeps clear of the
  border), and its radius is the row's plus that inset (16 = 8 + 8).

## Motion

- Every interactive control has layered hover and press feedback: a
  translucent wash, a scale or lift, and its icon moving once.
- Icon hover motion is subtle and plays once per entry (lift, swing, nudge,
  beat, turn), modelled on allsum-nsh's icon motion. No big presets.
- Layers move separately. On a card, the card lifts, the cover grows a
  little more slowly, and the play button rises and grows over both.
- Pages and their items enter with a short stagger; dialogs rise and fade
  in; toasts slide in and out; skeletons breathe.
- Navigation direction follows history: returning to a page already in the
  stack animates back, a page ahead animates forward.
- Everything respects reduced motion.

## Icons and logo

- Icons are [Reicon](https://reicon.dev) (MIT): Outline, with Filled for
  the transport and the liked heart. One family across the app.
- Icon hover motion follows the glyph's own shape, never a generic move
  pasted on: skip leaves an echo the way it goes, shuffle's lines cross,
  repeat's arrows turn once, the volume's waves come in one by one, the heart
  beats. Small and once per entry.
- The logo is a pair of beamed eighth notes (🎵) on a green rounded square.
  The app and the website favicon use the same mark.

## Layout and density

- Compact. Don't waste rows: a collection's header is a small cover, the
  title and an inline play button on one band.
- Sidebar library rows are one line, with small round covers (Liked Songs
  round too) and the playing indicator on the current row.
- No title above the library list; the panel is labelled for screen readers.

## Words

- Short, sentence case. Menu items say only what they are: Premium, Spotify,
  About…, GitHub, NSH, Log out. "…" marks an item that opens a dialog.
- Say "Spotify", not "spotify.com".
- The tray menu has three groups: "Open Spotish" on its own; then what plays
  (its title, Play/Pause, Next track, Previous track, Show Now Playing); then
  Quit Spotish.

## Performance

Spotish is NSH's showcase: it must be fast and light.

- Anything that can grow is a virtualized `List`: the library, a
  collection's tracks, the home page's sections and every row of cards
  (horizontal). Only what is near the view exists.
- Pictures are loaded at the size they show: small covers (up to 40pt) ask
  Spotify for the 64px variant (`src/data/images.ts`).
- Nothing redraws without a change to show (see the music light above).
- Hidden surfaces are unmounted, not just covered (the player bar under Now
  Playing).

## Obligations

These are not style and are never traded away: Spotify's ads play and are
never blocked or skipped, Premium is always offered to free accounts, the
unofficial disclaimer stays, and NSH is credited.
