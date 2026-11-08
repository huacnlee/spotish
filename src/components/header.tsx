// A page's header on the desktops, the web and in a terminal (iOS and
// Android show the system's, from the page's `title`): Back and Forward,
// and the account's action.

import { Text, View } from "nsh";
import { back, canBack, canForward, forward } from "../nav";
import { openPremium } from "../state/links";
import { player } from "../state/player";
import { signedIn, signIn } from "../state/session";
import { layout } from "./layout";
import { ActionButton, IconButton, terminal } from "./ui/controls";

/** Log in while signed out; Explore Premium for a free account; nothing
 * while the session is not known yet. */
export function AccountAction() {
  return (
    <View class="flex-row items-center gap-2">
      <If when={signedIn() === true && player().premium === false}>
        <ActionButton label="Explore Premium" onPress={openPremium} />
      </If>
      <If when={signedIn() === false}>
        <ActionButton label="Log in" variant="primary" onPress={signIn} />
      </If>
    </View>
  );
}

/** The header of a page: Back (and Forward where there is room), the
 * page's title when `title` shows, and the account's action. */
export function PageHeader(props: { title: string; showTitle?: boolean }) {
  const desktop = () => layout() === "desktop";
  return (
    <View
      class={
        terminal
          ? "flex-row items-center gap-1"
          : "min-h-14 flex-row items-center gap-2 px-4 pt-[env(safe-area-inset-top)]"
      }
    >
      <If when={canBack() || desktop()}>
        <IconButton name="chevronLeft" label="Go back" short="Back" disabled={!canBack()} onPress={back} />
      </If>
      <If when={desktop()}>
        <IconButton name="chevronRight" label="Go forward" short="Forward" disabled={!canForward()} onPress={forward} />
      </If>
      <If when={props.showTitle ?? false}>
        <Text role="header" class="line-clamp-1 flex-1 text-lg font-bold text-foreground">
          {props.title}
        </Text>
      </If>
      <View class="flex-1" />
      <AccountAction />
    </View>
  );
}
