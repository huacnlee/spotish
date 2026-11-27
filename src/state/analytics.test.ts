// Paths sent to NsMetry name the kind of page, never which one: an id in a
// path would be a dashboard row per album, and says what someone listens to.
import { expect, test } from "nsh/test";
import { HOME, LIKED, SEARCH } from "../nav";
import { routePath } from "./analytics";

test("routePath names the page's kind, never its id", () => {
  expect(routePath(HOME)).toBe("/home");
  expect(routePath(SEARCH)).toBe("/search");
  expect(routePath(LIKED)).toBe("/liked");
  expect(routePath({ name: "collection", uri: "spotify:album:4aawyAB9vmqN3uQ7FjRGTy" })).toBe("/album");
  expect(routePath({ name: "collection", uri: "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M" })).toBe("/playlist");
  expect(routePath({ name: "collection", uri: "spotify:artist:0OdUWJ0sBjDrqHygGUXeCF" })).toBe("/artist");
  expect(routePath({ name: "collection", uri: "spotify:user:someone:whatever" })).toBe("/collection");
});
