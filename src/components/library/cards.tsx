// Cards: playlists, albums, artists and tracks as tiles, in rows that
// scroll sideways or in a wrapping grid.

import { List, Text, View } from "nsh";
import { Button } from "nsh/base";
import { type Item, opens } from "../../backend/types";
import { open } from "../../nav";
import { isPlayingContext, playItem, toggleCollection } from "../../state/player";
import { ready } from "../../state/session";
import { Cover, focusRing, PlayButton, SectionTitle, terminal } from "../ui/controls";
import type { IconName } from "../ui/icons";
import { enter } from "../ui/motion";

/** The glyph an item shows while it has no image. */
export function fallbackIcon(kind: string): IconName {
  if (kind === "artist") return "user";
  if (kind === "album") return "disc";
  if (kind === "collection") return "heartFilled";
  return "music";
}

/** Opens an item's page, or plays it when it has none (a track). */
export function activate(item: Item): void {
  if (opens(item)) open({ name: "collection", uri: item.uri });
  else playItem(item);
}

/** How long apart cards enter, and the most any waits. */
const STAGGER = 35;
const MAX_DELAY = 280;

/** One card: picture, name, and what it is. It rises in after the cards
 * before it (`index`); on hover it lifts and shows its play button. */
export function Card(props: { item: Item; index?: number; delay?: number }) {
  const playing = () => isPlayingContext(props.item.uri);
  const play = () => (opens(props.item) ? toggleCollection(props.item.uri) : playItem(props.item));
  return (
    <Button
      accessibilityLabel={`${props.item.name}, ${props.item.subtitle}`}
      onPress={() => activate(props.item)}
      style={terminal ? undefined : enter("fadeInUp", (props.delay ?? 0) + Math.min((props.index ?? 0) * STAGGER, MAX_DELAY))}
      class={
        terminal
          ? "px-1 focus:bg-muted"
          : `group w-36 shrink-0 gap-2 rounded-(--radius-card) p-2.5 transition duration-200 ease-out hover:-translate-y-1 hover:bg-row-hover active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 ${focusRing}`
      }
    >
      <View class="relative">
        {/* Layered on hover: the card lifts, the cover grows a little more
            slowly under it, and the play button rises and grows over both. */}
        <View class="transition duration-300 ease-out group-hover:scale-[1.03] group-active:scale-[0.98] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <Cover
            src={props.item.image}
            round={props.item.kind === "artist"}
            liked={props.item.kind === "collection"}
            fallback={fallbackIcon(props.item.kind)}
            class="shadow-md transition-shadow duration-300 group-hover:shadow-xl"
          />
        </View>
        <If when={!terminal}>
          <View
            class={`absolute bottom-2 right-2 transition duration-200 ease-out group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none ${
              playing() ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-75 opacity-0"
            }`}
          >
            <PlayButton playing={playing()} size={44} disabled={!ready()} onPress={play} />
          </View>
        </If>
      </View>
      <View class={terminal ? "flex-row gap-1" : "gap-1"}>
        <Text class="line-clamp-1 text-sm font-semibold text-foreground">{props.item.name}</Text>
        <Text class="line-clamp-2 text-xs text-muted-foreground">{props.item.subtitle}</Text>
      </View>
    </Button>
  );
}

/** A titled row of cards that scrolls sideways (a list in a terminal). */
export function CardRow(props: { title: string; items: Item[]; class?: string; delay?: number }) {
  return (
    <View class={`gap-2 ${props.class ?? ""}`} style={terminal ? undefined : enter("fadeInUp", props.delay ?? 0)}>
      <SectionTitle class="px-3">{props.title}</SectionTitle>
      <If
        when={!terminal}
        else={
          <View>
            <Each of={props.items} key={(i) => i.uri}>
              {(item, index) => <Card item={item()} index={index()} delay={props.delay} />}
            </Each>
          </View>
        }
      >
        {/* Virtualized: only the cards near the view exist, recycled as the
            row scrolls (a row can hold dozens, each with its cover). The row
            is as tall as a card with two lines under it, plus room for the
            hover lift. */}
        <List
          horizontal
          each={props.items}
          keyExtractor={(i) => i.uri}
          estimatedItemSize={144}
          scrollbar={false}
          class="h-[216px]"
          contentClass="pt-1"
        >
          {(item, index) => (
            <If when={item()}>{(it) => <Card item={it()} index={index()} delay={props.delay} />}</If>
          )}
        </List>
      </If>
    </View>
  );
}

/** Cards that wrap into a grid (an artist's releases). */
export function CardGrid(props: { items: Item[] }) {
  return (
    <View class={terminal ? "" : "flex-row flex-wrap"}>
      <Each of={props.items} key={(i) => i.uri}>
        {(item, index) => <Card item={item()} index={index()} />}
      </Each>
    </View>
  );
}
