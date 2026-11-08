// Search: a field, then songs, artists, albums and playlists. A new search
// keeps the results that show, with a spinner, until its own arrive.

import { resource, Scroll, signal, token, View } from "nsh";
import { Input } from "nsh/base";
import type { SearchResults } from "../backend/types";
import { AppPage } from "../components/page";
import { pageEnd, wideTracks } from "../components/layout";
import { CardRow } from "../components/library/cards";
import { TrackHeader, TrackRow } from "../components/library/tracks";
import { SectionTitle, terminal } from "../components/ui/controls";
import { EmptyState, ErrorState, Spinner } from "../components/ui/feedback";
import { Icon } from "../components/ui/icons";
import { backend } from "../state/engine";
import { playTrack } from "../state/player";
import { dataEpoch, ready } from "../state/session";

/** What was typed: kept while the page comes and goes. */
const query = signal("");

/** Milliseconds of quiet typing before a search runs. */
const DEBOUNCE = 280;

function isEmpty(found: SearchResults): boolean {
  return found.tracks.length + found.artists.length + found.albums.length + found.playlists.length === 0;
}

export function SearchPage() {
  const term = () => query().trim();
  const results = resource(
    () => (term() ? { term: term(), epoch: dataEpoch() } : null),
    async (s, { signal: abort }) => {
      await new Promise((resolve) => setTimeout(resolve, DEBOUNCE));
      if (abort.aborted) throw new Error("superseded");
      return { term: s.term, found: await backend.search(s.term) };
    },
  );
  const busy = () => results.state() === "pending" || results.state() === "refreshing";
  const shown = () => (term() ? results()?.found : undefined);

  return (
    <AppPage title="Search" testID="page-search">
      <View class={terminal ? "flex-row items-center gap-1" : "flex-row items-center gap-3 px-6 pb-4"}>
        <View
          class={
            terminal
              ? "flex-1 flex-row items-center border border-border"
              : "h-12 max-w-120 flex-1 flex-row items-center gap-3 rounded-full border border-secondary bg-secondary px-4 focus-within:border-foreground"
          }
        >
          <If when={!terminal}>
            <Icon name="search" size={20} color="muted-foreground" />
          </If>
          <Input
            value={query()}
            onChange={({ value }) => query.set(value)}
            placeholder="What do you want to play?"
            accessibilityLabel="Search Spotify"
            returnKeyType="search"
            autoFocus={!terminal}
            class="flex-1 text-base text-foreground"
            style={{ placeholderColor: token("muted-foreground"), caretColor: token("primary") }}
          />
        </View>
        <If when={busy() && !!term()}>
          <Spinner label="Searching" />
        </If>
      </View>
      <Scroll class="flex-1" contentClass={pageEnd()}>
        <If when={term()} else={<EmptyState title="Search Spotify" detail="Find songs, artists, albums and playlists." />}>
          <If
            when={shown()}
            else={
              <If when={results.state() === "errored"}>
                <ErrorState message="Search didn't work." onRetry={results.refetch} />
              </If>
            }
          >
            {(found) => (
              <If when={!isEmpty(found())} else={<EmptyState title="No results" detail="Check the spelling, or try fewer words." />}>
                <View class={terminal ? "gap-1" : "gap-8"}>
                  <If when={found().tracks.length > 0}>
                    <View class="gap-2">
                      <SectionTitle class="px-6">Songs</SectionTitle>
                      <TrackHeader showAlbum={wideTracks()} />
                      <Each of={found().tracks} key={(t) => t.uid || t.uri}>
                        {(track, i) => (
                          <TrackRow
                            track={track()}
                            number={i()}
                            showAlbum={wideTracks()}
                            disabled={!ready()}
                            onPress={() => playTrack(track())}
                          />
                        )}
                      </Each>
                    </View>
                  </If>
                  <If when={found().artists.length > 0}>
                    <CardRow title="Artists" items={found().artists} class="px-3" />
                  </If>
                  <If when={found().albums.length > 0}>
                    <CardRow title="Albums" items={found().albums} class="px-3" />
                  </If>
                  <If when={found().playlists.length > 0}>
                    <CardRow title="Playlists" items={found().playlists} class="px-3" />
                  </If>
                </View>
              </If>
            )}
          </If>
        </If>
      </Scroll>
    </AppPage>
  );
}
