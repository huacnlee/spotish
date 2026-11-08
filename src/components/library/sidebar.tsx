// The sidebar: the main pages, the user's library and the account. On a
// narrow desktop window it is a `compact` rail of icons and covers (each
// with a tooltip); the phone's drawer shows it in full.

import { List, signal, Text, View } from "nsh";
import { Button, Menu, MenuItem, MenuSeparator } from "nsh/base";
import type { Item } from "../../backend/types";
import { libraryQuery, meQuery } from "../../data/queries";
import { currentRoute, type Route, switchTo } from "../../nav";
import { NSH_URL, openExternal, openPremium, REPO_URL, SPOTIFY_URL } from "../../state/links";
import { setAboutOpen, setDrawerOpen } from "../../state/overlays";
import { isCurrentContext, isPlayingContext, player } from "../../state/player";
import { signedIn, signIn, signOut } from "../../state/session";
import { ActionButton, Cover, focusRing, Hint, IconButton, LAYER, menuItem, popupSurface, terminal } from "../ui/controls";
import { ErrorState, RowsSkeleton } from "../ui/feedback";
import { Icon, iconMotion, type IconName } from "../ui/icons";
import { PlayingBars } from "../ui/playing";
import { fallbackIcon } from "./cards";

/** Switches to a page from the sidebar, cross-fading rather than
 * sliding (and closes the phone's drawer). */
function go(route: Route) {
  switchTo(route);
  setDrawerOpen(false);
}

/** One of the main pages. */
function NavItem(props: { icon: IconName; label: string; route: Route; compact: boolean }) {
  const selected = () => currentRoute().name === props.route.name;
  const hover = iconMotion();
  return (
    <View onMouseEnter={() => hover.play(props.icon)}>
    <Button
      accessibilityLabel={props.label}
      selected={selected()}
      onPress={() => go(props.route)}
      tooltip={props.compact ? <Hint label={props.label} /> : undefined}
      class={
        terminal
          ? "px-1 focus:bg-muted selected:bg-muted"
          : `group h-11 flex-row items-center gap-3 rounded-(--radius-inset) transition duration-200 ease-out hover:bg-row-hover active:scale-[0.98] selected:bg-secondary motion-reduce:transition-none ${focusRing} ${
              props.compact ? "justify-center" : "px-2"
            }`
      }
    >
      <If when={!terminal}>
        {/* As wide as a library row's cover, so icons, covers and labels
            line up down the whole sidebar. */}
        <View class={`w-[30px] items-center ${LAYER} group-active:scale-90`}>
          <View style={hover.style}>
            <Icon name={props.icon} size={22} color={selected() ? "foreground" : "muted-foreground"} />
          </View>
        </View>
      </If>
      <If when={!props.compact || terminal}>
        <Text class={`text-base font-bold ${LAYER} group-hover:translate-x-0.5 ${selected() ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{props.label}</Text>
      </If>
    </Button>
    </View>
  );
}

/** One library entry: a cell of the recycling list, so it reads `item()`
 * where it is used. */
function LibraryRow(props: { item: Item | undefined; compact: boolean }) {
  const uri = () => props.item?.uri ?? "";
  const kind = () => props.item?.kind ?? "";
  const selected = () => {
    const route = currentRoute();
    return route.name === "collection" && route.uri === uri();
  };
  const playingHere = () => isPlayingContext(uri());
  const current = () => isCurrentContext(uri());
  return (
    <Button
      accessibilityLabel={props.item?.name ?? ""}
      selected={selected()}
      onPress={() => uri() && go({ name: "collection", uri: uri() })}
      tooltip={props.compact ? <Hint label={props.item?.name ?? ""} /> : undefined}
      class={
        terminal
          ? "flex-row gap-1 px-1 focus:bg-muted selected:bg-muted"
          : `group h-11 flex-row items-center gap-3 rounded-(--radius-inset) px-2 transition duration-200 ease-out hover:bg-row-hover active:scale-[0.98] active:bg-muted selected:bg-secondary motion-reduce:transition-none ${focusRing} ${
              props.compact ? "justify-center" : ""
            }`
      }
    >
      <Cover
        src={props.item?.image ?? ""}
        size={props.compact ? 36 : 30}
        round
        liked={kind() === "collection"}
        fallback={fallbackIcon(kind())}
        class={`${LAYER} group-hover:scale-110 group-active:scale-95`}
      />
      <If when={!props.compact || terminal}>
        <Text class={`line-clamp-1 min-w-0 flex-1 text-sm font-medium ${current() ? "text-primary" : "text-foreground"}`}>
          {props.item?.name ?? ""}
        </Text>
        <If when={current() && !terminal}>
          <PlayingBars playing={playingHere()} size={12} />
        </If>
      </If>
    </Button>
  );
}

/** The library: the list (signed in), a login prompt (signed out), or
 * skeleton rows while it is not known yet. */
function LibraryPanel(props: { compact: boolean }) {
  const library = libraryQuery();
  return (
    <View accessibilityLabel="Your Library" class={terminal ? "min-h-0 flex-1" : "relative min-h-0 flex-1 overflow-hidden rounded-(--radius-panel) border border-border bg-card"}>
      <If when={signedIn() !== false} else={<SignedOutPrompt compact={props.compact} />}>
        <If when={library.data()} else={<LibraryPlaceholder query={library} compact={props.compact} />}>
          {(lib) => (
            <List
              each={lib().items}
              keyExtractor={(i) => i.uri}
              estimatedItemSize={48}
              contentClass="px-2 pt-2 pb-1"
              class="flex-1"
            >
              {(item) => (
                <View class="pb-1">
                  <LibraryRow item={item()} compact={props.compact} />
                </View>
              )}
            </List>
          )}
        </If>
      </If>
      {/* Rows leave the panel softly at its bottom edge, not cut off. */}
      <If when={!terminal}>
        <View class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent" />
      </If>
    </View>
  );
}

function LibraryPlaceholder(props: { query: ReturnType<typeof libraryQuery>; compact: boolean }) {
  return (
    <If when={props.query.error() && !props.compact} else={<RowsSkeleton rows={props.compact ? 4 : 6} />}>
      <ErrorState message="Your library didn't load." onRetry={props.query.refetch} />
    </If>
  );
}

function SignedOutPrompt(props: { compact: boolean }) {
  return (
    <If
      when={props.compact && !terminal}
      else={
        <View class="m-2 gap-3 rounded-(--radius-card) border border-border p-4">
          <Text class="text-base font-bold text-foreground">Your playlists live here</Text>
          <Text class="text-sm text-muted-foreground">Log in with your Spotify account, free or Premium, to see your library.</Text>
          <View class="flex-row">
            <ActionButton label="Log in" variant="primary" onPress={signIn} />
          </View>
        </View>
      }
    >
      <View class="m-2 items-center">
        <IconButton name="logIn" label="Log in" hint onPress={signIn} />
      </View>
    </If>
  );
}

/** One row of the user menu: an icon slot, the label, and a mark for a
 * page that opens in the browser. */
function Entry(props: { icon: IconName; label: string; external?: boolean; onSelect: () => void }) {
  const hover = iconMotion();
  return (
    <MenuItem onSelect={props.onSelect} class={terminal ? "px-1 focus:bg-muted" : menuItem}>
      <View onMouseEnter={() => hover.play(props.icon)} class="flex-1 flex-row items-center gap-2.5">
        <If when={!terminal}>
          <View style={hover.style}>
            <Icon name={props.icon} size={16} color="muted-foreground" />
          </View>
        </If>
        <Text class="flex-1 text-sm text-popover-foreground">{props.label}</Text>
        <If when={props.external && !terminal}>
          <Icon name="externalLink" size={12} color="muted-foreground" />
        </If>
      </View>
    </MenuItem>
  );
}

const Separator = () => <MenuSeparator class={terminal ? "hidden" : "-mx-1 my-1 h-px bg-border"} />;

/** The user menu: who is signed in and on which plan, then Premium, Spotish
 * and NSH, and Log out. */
function MenuEntries(props: { name: string; image: string }) {
  const premium = () => player().premium === true;
  return (
    <>
      <If when={signedIn() === true && !terminal}>
        <View class="flex-row items-center gap-2.5 px-2.5 py-2">
          <Cover src={props.image} size={32} round fallback="user" />
          <View class="min-w-0 flex-1">
            <Text class="line-clamp-1 text-sm font-semibold text-popover-foreground">{props.name}</Text>
            <Text class="text-xs text-muted-foreground">{premium() ? "Spotify Premium" : "Spotify Free"}</Text>
          </View>
        </View>
        <Separator />
      </If>
      <If when={!premium()}>
        <Entry icon="sparkles" label="Premium" external onSelect={openPremium} />
      </If>
      <Entry icon="music" label="Spotify" external onSelect={() => openExternal(SPOTIFY_URL)} />
      <Separator />
      <Entry icon="info" label="About…" onSelect={() => setAboutOpen(true)} />
      <Entry icon="github" label="GitHub" external onSelect={() => openExternal(REPO_URL)} />
      <Entry icon="code" label="NSH" external onSelect={() => openExternal(NSH_URL)} />
      <If when={signedIn() === true}>
        <Separator />
        <Entry icon="logOut" label="Log out" onSelect={() => void signOut()} />
      </If>
    </>
  );
}

/** The account at the sidebar's foot, which opens the user menu: the
 * user's picture and name (Spotish, signed out). */
function Account(props: { compact: boolean }) {
  const me = meQuery();
  const name = () => (signedIn() === true ? me.data()?.name || "Account" : "Spotish");
  const open = signal(false);
  return (
    <Menu
      open={open()}
      onOpenChange={(e) => open.set(e.open)}
      placement="top"
      align="start"
      offset={4}
      popupClass={`w-64 ${popupSurface} transition duration-150 ease-out motion-reduce:transition-none`}
      popupStartingClass="opacity-0 translate-y-1"
      popupEndingClass="opacity-0"
      trigger={
        <Button
          accessibilityLabel={`User menu: ${name()}`}
          selected={open()}
          tooltip={props.compact ? <Hint label={name()} /> : undefined}
          class={
            terminal
              ? "px-1 focus:bg-muted"
              : `group h-11 flex-row items-center gap-3 rounded-(--radius-inset) transition duration-200 ease-out hover:bg-row-hover active:scale-[0.98] selected:bg-secondary motion-reduce:transition-none ${focusRing} ${
                  props.compact ? "justify-center" : "px-2"
                }`
          }
        >
          <Cover
            src={signedIn() === true ? (me.data()?.image ?? "") : ""}
            size={30}
            round
            fallback="user"
            class={LAYER}
          />
          <If when={!props.compact || terminal}>
            <Text class="line-clamp-1 flex-1 text-sm font-semibold text-foreground">{name()}</Text>
            <If when={!terminal}>
              {/* The menu opens upward: the chevron points to it. */}
              <View class={`rotate-180 ${LAYER} opacity-60 group-hover:opacity-100 group-hover:-translate-y-0.5`}>
                <Icon name="chevronDown" size={14} color="muted-foreground" />
              </View>
            </If>
          </If>
        </Button>
      }
    >
      <MenuEntries name={name()} image={me.data()?.image ?? ""} />
    </Menu>
  );
}

/** The whole sidebar; `compact` is the desktop's icon rail. */
export function Sidebar(props: { compact?: boolean }) {
  const compact = () => (props.compact ?? false) && !terminal;
  return (
    <View
      role="navigation"
      class={terminal ? "min-h-0 flex-1 gap-1" : "min-h-0 flex-1 gap-2"}
    >
      <View class={terminal ? "" : `gap-1 rounded-(--radius-panel) border border-border bg-card p-2`}>
        <NavItem icon="home" label="Home" route={{ name: "home" }} compact={compact()} />
        <NavItem icon="search" label="Search" route={{ name: "search" }} compact={compact()} />
      </View>
      <LibraryPanel compact={compact()} />
      {/* The account: a panel of its own, its row like every other. */}
      <View class={terminal ? "" : "rounded-(--radius-panel) border border-border bg-card p-2"}>
        <Account compact={compact()} />
      </View>
    </View>
  );
}
