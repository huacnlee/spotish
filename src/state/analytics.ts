// Anonymous usage numbers, sent to the project's own NsMetry instance: which
// screens are opened and which failures people run into. Nothing personal
// goes out: no account, no track or playlist names, no ids in paths, no
// search text. The user id is a random UUID made once per install and kept
// in NSH `Storage`; the server hashes it per site.
//
// The demo (tests, the web, phones) sends nothing: its numbers would be
// nobody's listening.

import { appInfo, platform } from "nsh";
import { createNsMetry, describePlatform } from "nsmetry";
import type { Route } from "../nav";
import { isDemo } from "./engine";

/** What the dashboard reads the OS and device class from, under the app's
 * own name and version: `Spotish/0.1.5 (macOS 15.1)`. */
function userAgent(version: string | undefined): string | undefined {
  const described = describePlatform(platform);
  if (!described || !version) return described;
  return described.replace(/^NsMetry-NSH\/\S+/, `Spotish/${version}`);
}

function appVersion(): string | undefined {
  try {
    return appInfo().version ?? undefined;
  } catch {
    return undefined;
  }
}

const version = appVersion();

/** The app's one client. Events wait in memory and go out together: every
 * 30 seconds while some are waiting, at once when 50 are, and when the app
 * goes to the background or quits (`useNsMetry` in `App.tsx`). */
export const analytics = createNsMetry({
  endpoint: "https://nsmetry.huacnlee-account.workers.dev",
  site: "spotish",
  persistUserId: true,
  appVersion: version,
  ua: userAgent(version),
  flushInterval: 30_000,
  disabled: isDemo,
});

/** The kinds of collection a path may name; any other is `/collection`. */
const KINDS = new Set(["playlist", "album", "artist", "show", "episode"]);

/** A route's path for the dashboard: its kind, never its id
 * (`spotify:album:4aawy…` is `/album`, Liked Songs is `/liked`). */
export function routePath(route: Route): string {
  if (route.name !== "collection") return `/${route.name}`;
  const kind = route.uri.split(":")[1] ?? "";
  if (kind === "collection") return "/liked";
  return KINDS.has(kind) ? `/${kind}` : "/collection";
}

/** A failure the user was told about: the message's id and the backend's
 * error code (`E_TIMEOUT`), never its free-text message. */
export function trackError(message: string, code: string): void {
  analytics.track("error", { message, code: /^E_[A-Z0-9_]{1,60}$/.test(code) ? code : "E_UNKNOWN" });
}
