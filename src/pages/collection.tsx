// A collection's page: a playlist, album, artist or Liked Songs, with its
// header, a play button and its tracks in a virtualized, recycling list.
// Each opened collection is a page of its own in the stack, with its own
// list and scroll position.

import { List, Text, View } from "nsh";
import type { Collection } from "../backend/types";
import { AppPage } from "../components/page";
import { layout, pageEnd, wideTracks } from "../components/layout";
import { CardGrid } from "../components/library/cards";
import { TrackHeader, TrackRow } from "../components/library/tracks";
import {
  Cover,
  PlayButton,
  SectionTitle,
  terminal,
} from "../components/ui/controls";
import { enter } from "../components/ui/motion";
import {
  EmptyState,
  ErrorState,
  RowsSkeleton,
} from "../components/ui/feedback";
import { collectionQuery } from "../data/queries";
import { isPlayingContext, playFrom, toggleCollection } from "../state/player";
import { ready } from "../state/session";

const KIND_LABEL: Record<string, string> = {
  album: "Album",
  artist: "Artist",
  collection: "Playlist",
  playlist: "Playlist",
};

function Header(props: { uri: string; data: Collection }) {
  const header = () => props.data.header;
  const phone = () => layout() !== "desktop";
  const play = (size: number) => (
    <PlayButton
      playing={isPlayingContext(props.uri)}
      size={size}
      disabled={!ready() || props.data.tracks.length === 0}
      onPress={() => toggleCollection(props.uri)}
    />
  );
  return (
    <View
      class={
        terminal
          ? "gap-1"
          : phone()
            ? "items-center gap-3 px-6 pb-4 pt-1"
            : "flex-row items-end gap-4 px-6 pb-4 pt-1"
      }
    >
      <View style={terminal ? undefined : enter("zoomIn")} class={phone() ? "w-full max-w-40" : ""}>
        <Cover
          src={header().image}
          round={header().kind === "artist"}
          liked={header().kind === "collection"}
          class={phone() ? "w-full shadow-xl" : "w-24 shadow-xl"}
        />
      </View>
      <View class="min-w-0 flex-1 gap-1 self-stretch justify-end" style={terminal ? undefined : enter("fadeInUp", 80)}>
        <Text class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {KIND_LABEL[header().kind] ?? "Playlist"}
        </Text>
        <Text role="header" class={`line-clamp-1 font-extrabold text-foreground ${phone() ? "text-2xl" : "text-3xl"}`}>
          {header().name}
        </Text>
        <If when={header().description}>
          <Text class="line-clamp-1 text-sm text-muted-foreground">{header().description}</Text>
        </If>
        <Text class="text-sm font-semibold text-foreground">{header().subtitle}</Text>
      </View>
      <View class="shrink-0" style={terminal ? undefined : enter("zoomIn", 160)}>
        {play(phone() ? 48 : 44)}
      </View>
    </View>
  );
}

function Tracks(props: { uri: string; data: Collection }) {
  const artist = () => props.data.header.kind === "artist";
  const showAlbum = () => wideTracks() && !artist();
  // The rows come in while the page opens; any made after that just show.
  const opened = Date.now();
  const opening = () => Date.now() - opened < 900;
  return (
    <List
      each={props.data.tracks}
      keyExtractor={(t) => t.uid + t.uri}
      estimatedItemSize={48}
      header={() => (
        <View>
          <Header uri={props.uri} data={props.data} />
          <If when={artist()}>
            <SectionTitle class="px-6 pb-2">Popular</SectionTitle>
          </If>
          <TrackHeader showAlbum={showAlbum()} />
        </View>
      )}
      footer={() => (
        <View class={pageEnd()}>
          <If when={props.data.releases.length > 0}>
            <View class="gap-2 px-3 pt-8">
              <SectionTitle class="px-3">Discography</SectionTitle>
              <CardGrid items={props.data.releases} />
            </View>
          </If>
        </View>
      )}
      empty={() => <EmptyState title="Nothing here yet" />}
      class="flex-1"
    >
      {(row, index) => (
        <TrackRow
          track={row()}
          number={index()}
          showAlbum={showAlbum()}
          secondary={artist() ? "album" : "artists"}
          disabled={!ready()}
          entrance={opening()}
          onPress={() => {
            const track = row();
            if (track) playFrom(props.uri, track.uri);
          }}
        />
      )}
    </List>
  );
}

export function CollectionPage(props: { uri: string }) {
  const query = collectionQuery(() => props.uri);
  const title = () => query.data()?.header.name ?? "";
  const liked = () => query.data()?.header.kind === "collection";
  const body = () => (
    <If
      when={query.data()}
      else={
        <If when={query.error()} else={<RowsSkeleton />}>
          <ErrorState
            message="This page didn't load."
            onRetry={query.refetch}
          />
        </If>
      }
    >
      {(data) => <Tracks uri={props.uri} data={data()} />}
    </If>
  );
  return (
    <AppPage
      title={title()}
      testID={`page-${props.uri}`}
    >
      {body()}
    </AppPage>
  );
}
