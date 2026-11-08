// Fictional music for `DemoBackend`: every name here is made up. The covers
// are left empty, so the UI draws its own placeholders.

import type { Collection, Home, Item, Library, Track } from "./types";

interface ArtistSeed {
  id: string;
  name: string;
}

interface AlbumSeed {
  id: string;
  name: string;
  artist: ArtistSeed;
  year: number;
  titles: string[];
}

const QUIET_FIELDS: ArtistSeed = { id: "quietfields", name: "The Quiet Fields" };
const MIRA_VALE: ArtistSeed = { id: "miravale", name: "Mira Vale" };
const LOW_HARBOR: ArtistSeed = { id: "lowharbor", name: "Low Harbor" };

export const ARTISTS = [QUIET_FIELDS, MIRA_VALE, LOW_HARBOR];

const ALBUMS: AlbumSeed[] = [
  {
    id: "paperlanterns",
    name: "Paper Lanterns",
    artist: QUIET_FIELDS,
    year: 2021,
    titles: ["First Light", "Paper Lanterns", "Slow River", "Window Seat", "Hollow Pines", "Kites", "Small Hours", "Homeward"],
  },
  {
    id: "neonorchard",
    name: "Neon Orchard",
    artist: MIRA_VALE,
    year: 2023,
    titles: ["Orchard", "Glass Bees", "Overpass", "Static Bloom", "Night Market", "Afterglow"],
  },
  {
    id: "saltlines",
    name: "Salt Lines",
    artist: LOW_HARBOR,
    year: 2019,
    titles: ["Breakwater", "Tidewatch", "Lighthouse Keeper", "Fog Signal", "Ropes", "Harbor Lights", "Ebb"],
  },
];

function trackOf(album: AlbumSeed, index: number): Track {
  const title = album.titles[index];
  // A length between 2:30 and 4:50 that stays the same between runs.
  const seconds = 150 + ((index * 37 + album.id.length * 11) % 140);
  return {
    uri: `spotify:track:${album.id}${index + 1}`,
    uid: `${album.id}-${index + 1}`,
    name: title,
    artists: album.artist.name,
    album: album.name,
    albumUri: `spotify:album:${album.id}`,
    image: "",
    durationMs: seconds * 1000,
    explicit: index === 3,
    playable: true,
  };
}

const ALL_TRACKS: Track[] = ALBUMS.flatMap((album) => album.titles.map((_, i) => trackOf(album, i)));

function pick(uris: number[]): Track[] {
  return uris.map((i) => ALL_TRACKS[i % ALL_TRACKS.length]);
}

interface PlaylistSeed {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
}

const PLAYLISTS: PlaylistSeed[] = [
  { id: "morningstatic", name: "Morning Static", description: "Soft starts for slow mornings.", tracks: pick([0, 8, 14, 2, 10, 16, 4, 12, 18, 6]) },
  { id: "latetrains", name: "Late Trains", description: "For the last ride home.", tracks: pick([13, 9, 3, 15, 11, 5, 19, 7]) },
  { id: "harborwalk", name: "Harbor Walk", description: "Salt air and long coats.", tracks: pick([14, 15, 16, 17, 18, 19, 20]) },
];

const LIKED: Track[] = pick([1, 9, 15, 4, 11, 20]);

export const LIKED_URI = "spotify:collection:tracks";

function playlistItem(p: PlaylistSeed): Item {
  return { uri: `spotify:playlist:${p.id}`, kind: "playlist", name: p.name, subtitle: "Playlist · Demo", image: "" };
}

function albumItem(a: AlbumSeed): Item {
  return { uri: `spotify:album:${a.id}`, kind: "album", name: a.name, subtitle: `${a.year} · ${a.artist.name}`, image: "" };
}

function artistItem(a: ArtistSeed): Item {
  return { uri: `spotify:artist:${a.id}`, kind: "artist", name: a.name, subtitle: "Artist", image: "" };
}

/** Every item the demo knows, for search. */
const ITEMS: Item[] = [...PLAYLISTS.map(playlistItem), ...ALBUMS.map(albumItem), ...ARTISTS.map(artistItem)];

/** The home page of the account named `name`. */
export function homeFor(name: string): Home {
  return {
    greeting: `Good evening, ${name}`,
    sections: [
      { title: "Made for you", items: PLAYLISTS.map(playlistItem) },
      { title: "Albums you'll like", items: ALBUMS.map(albumItem) },
      { title: "Artists", items: ARTISTS.map(artistItem) },
    ],
  };
}

export function library(): Library {
  return {
    items: [
      { uri: LIKED_URI, kind: "collection", name: "Liked Songs", subtitle: `Playlist · ${LIKED.length} songs`, image: "" },
      ...PLAYLISTS.map(playlistItem),
      ...ALBUMS.slice(0, 2).map(albumItem),
      artistItem(LOW_HARBOR),
    ],
  };
}

/** A collection by URI, or null when the demo has none. */
export function collection(uri: string): Collection | null {
  const [, kind, id] = uri.split(":");
  if (uri === LIKED_URI) {
    return {
      header: { uri, kind: "collection", name: "Liked Songs", subtitle: `${LIKED.length} songs`, image: "", description: "" },
      tracks: LIKED,
      releases: [],
      total: LIKED.length,
    };
  }
  if (kind === "playlist") {
    const p = PLAYLISTS.find((x) => x.id === id);
    if (!p) return null;
    return {
      header: { uri, kind, name: p.name, subtitle: `Demo · ${p.tracks.length} songs`, image: "", description: p.description },
      tracks: p.tracks,
      releases: [],
      total: p.tracks.length,
    };
  }
  if (kind === "album") {
    const a = ALBUMS.find((x) => x.id === id);
    if (!a) return null;
    const tracks = a.titles.map((_, i) => trackOf(a, i));
    return {
      header: { uri, kind, name: a.name, subtitle: `${a.artist.name} · ${a.year} · ${tracks.length} songs`, image: "", description: "" },
      tracks,
      releases: [],
      total: tracks.length,
    };
  }
  if (kind === "artist") {
    const artist = ARTISTS.find((x) => x.id === id);
    if (!artist) return null;
    const albums = ALBUMS.filter((a) => a.artist.id === artist.id);
    const tracks = ALL_TRACKS.filter((t) => t.artists === artist.name).slice(0, 5);
    return {
      header: { uri, kind, name: artist.name, subtitle: "Demo artist", image: "", description: "" },
      tracks,
      releases: albums.map(albumItem),
      total: tracks.length,
    };
  }
  return null;
}

/** What a search for `query` finds: names containing it, case-insensitively. */
export function search(query: string) {
  const q = query.trim().toLowerCase();
  const has = (text: string) => text.toLowerCase().includes(q);
  return {
    tracks: ALL_TRACKS.filter((t) => has(t.name) || has(t.artists)).slice(0, 8),
    artists: ITEMS.filter((i) => i.kind === "artist" && has(i.name)),
    albums: ITEMS.filter((i) => i.kind === "album" && (has(i.name) || has(i.subtitle))),
    playlists: ITEMS.filter((i) => i.kind === "playlist" && has(i.name)),
  };
}

/** The demo's ad: a made-up sponsor. */
export const AD = { title: "Fieldnote Coffee", artwork: "", durationMs: 15000 };
