// Playback: the player's state as the UI shows it, and the intents that
// change it. The backend owns playback; this mirrors it, moves the position
// on locally between its messages, and shows a control's result at once
// (an optimistic value) until the backend's next message replaces it. A
// control that fails drops its own optimistic value, so nothing stays on
// screen that did not happen.

import { cleanup, computed, effect, signal, untracked } from "nsh";
import { EMPTY_PLAYER, type Item, type PlayerState, positionAt, type RepeatMode } from "../backend/types";
import { backend } from "./engine";
import { type MessageId, notify, report } from "./feedback";
import { openPremium } from "./links";
import { askToSignIn, ready, signedIn } from "./session";

const optimistic = signal<Partial<PlayerState>>({});

// The backend's next message replaces every optimistic value.
effect(() => {
  backend.player();
  untracked(() => {
    if (Object.keys(optimistic()).length > 0) optimistic.set({});
  });
});

/** The player as shown: the backend's state with the values of controls
 * still on their way over it (tracked). */
export const player = computed<PlayerState>(() => ({ ...EMPTY_PLAYER, ...backend.player(), ...optimistic() }));

const playing = computed(() => player().playing);
const now = signal(Date.now());

// While playing, the clock ticks so the position moves on.
effect(() => {
  if (!playing()) return;
  now.set(Date.now());
  const timer = setInterval(() => now.set(Date.now()), 250);
  cleanup(() => clearInterval(timer));
});

const seekDraft = signal<number | null>(null);
const volumeDraft = signal<number | null>(null);

/** The position to show: the drag in progress, else the player's (tracked). */
export const position = () => seekDraft() ?? positionAt(player(), now());

/** The volume to show, 0 while muted: the drag in progress, else the
 * player's (tracked). */
export const volumeLevel = () => {
  const draft = volumeDraft();
  if (draft !== null) return draft;
  const p = player();
  return p.muted ? 0 : p.volume;
};

/** Whether something is loaded (tracked). */
export const hasTrack = () => player().title !== "";

/** Whether the controls can act (tracked): the player is ready, and a
 * track (not an ad) is loaded for the ones that need one. */
export const controlsEnabled = () => ready() && signedIn() === true && hasTrack();

/** Whether `uri` is the collection playing now (tracked). */
export function isPlayingContext(uri: string): boolean {
  const p = player();
  return p.playing && uri !== "" && p.contextUri === uri;
}

/** Whether `uri` is the collection loaded, playing or not (tracked). */
export function isCurrentContext(uri: string): boolean {
  return uri !== "" && player().contextUri === uri;
}

/** Whether `uri` is the track loaded (tracked). */
export function isCurrentTrack(uri: string): boolean {
  return uri !== "" && player().trackUri === uri;
}

// ---- Intents ----

/** Whether a play request may go to the backend: a signed-out user is asked
 * to log in. Controls are disabled until the player is ready. */
function allowed(): boolean {
  if (!ready()) return false;
  if (signedIn() !== true) {
    askToSignIn();
    return false;
  }
  return true;
}

/** Sends a control, showing `change` until the backend answers; a failure
 * drops `change` (where no later control replaced it) and says so. */
function send(change: Partial<PlayerState>, action: () => Promise<void>, failure: MessageId = "playFailed"): void {
  if (!allowed()) return;
  if (Object.keys(change).length > 0) optimistic.update((o) => ({ ...o, ...change }));
  action().catch((error) => {
    optimistic.update((o) => {
      const next: Record<string, unknown> = { ...o };
      for (const key of Object.keys(change) as (keyof PlayerState)[]) {
        if (next[key] === change[key]) delete next[key];
      }
      return next as Partial<PlayerState>;
    });
    report(failure, error);
  });
}

export function toggle(): void {
  const p = player();
  if (!p.title) return;
  const at = Date.now();
  send({ playing: !p.playing, positionMs: positionAt(p, at), at }, () => (p.playing ? backend.pause() : backend.play()));
}

/** Plays (the system's media controls); nothing when it plays already. */
export function play(): void {
  if (!player().playing) toggle();
}

/** Pauses (the system's media controls); nothing when it is paused. */
export function pause(): void {
  if (player().playing) toggle();
}

export function next(): void {
  send({}, () => backend.next());
}

export function previous(): void {
  send({}, () => backend.previous());
}

/** The position drag moved: shown, not sent. */
export function dragSeek(ms: number): void {
  seekDraft.set(ms);
}

/** Seeks to `ms` (the drag ended there). */
export function seek(ms: number): void {
  seekDraft.set(null);
  send({ positionMs: ms, at: Date.now() }, () => backend.seek(ms));
}

/** The volume drag moved: shown, not sent. */
export function dragVolume(volume: number): void {
  volumeDraft.set(volume);
}

/** Sets the volume (the drag ended there); a muted player unmutes. */
export function setVolume(volume: number): void {
  volumeDraft.set(null);
  if (player().muted) {
    send({ muted: false, volume }, async () => {
      await backend.setMuted(false);
      await backend.setVolume(volume);
    });
  } else {
    send({ volume }, () => backend.setVolume(volume));
  }
}

export function toggleMute(): void {
  const muted = !player().muted;
  send({ muted }, () => backend.setMuted(muted));
}

export function toggleShuffle(): void {
  const shuffle = !player().shuffle;
  send({ shuffle }, () => backend.setShuffle(shuffle));
}

const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { off: "context", context: "track", track: "off" };

export function cycleRepeat(): void {
  const repeat = NEXT_REPEAT[player().repeat];
  send({ repeat }, () => backend.setRepeat(repeat));
}

export function toggleLike(): void {
  const liked = !player().liked;
  send({ liked }, () => backend.setLiked(liked), "likeFailed");
}

let freeNoticeShown = false;

/** Tells a free account, once a session, that it shuffles. */
function noteFreeTier(): void {
  if (freeNoticeShown || player().premium !== false) return;
  freeNoticeShown = true;
  notify("freeShuffles", { label: "Get Premium", run: openPremium });
}

/** Plays a whole collection. */
export function playCollection(uri: string): void {
  send({}, () => backend.playContext(uri, null));
}

/** Plays `trackUri` within the collection `contextUri`; a free account
 * plays the collection shuffled, and hears why once. */
export function playFrom(contextUri: string, trackUri: string): void {
  if (!allowed()) return;
  noteFreeTier();
  send({}, () => backend.playContext(contextUri, trackUri));
}

/** Plays a track found outside a collection: Premium plays it on its own;
 * a free account plays its album, the track's context. */
export function playTrack(track: { uri: string; albumUri?: string }): void {
  if (player().premium === true || !track.albumUri) {
    send({}, () => backend.playTrack(track.uri));
    return;
  }
  playFrom(track.albumUri, track.uri);
}

/** Plays a card: its collection, or the track it is. */
export function playItem(item: Item): void {
  if (item.kind === "track") playTrack({ uri: item.uri });
  else playCollection(item.uri);
}

/** The play button of a collection: pauses or resumes it while it is the
 * one loaded, else plays it. */
export function toggleCollection(uri: string): void {
  if (isCurrentContext(uri) && hasTrack()) toggle();
  else playCollection(uri);
}
