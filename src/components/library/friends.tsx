// Friend activity: what the people the user follows last listened to, as
// Spotify's own activity panel shows it, in a panel down the desktop's
// right edge that the header's button folds away.

import { List, Text, View } from "nsh";
import type { Friend } from "../../backend/types";
import { friendsQuery } from "../../data/queries";
import { toggleFriends } from "../../state/friends-panel";
import { Cover, IconButton, terminal } from "../ui/controls";
import { ErrorState } from "../ui/feedback";
import { PlayingBars } from "../ui/playing";

/** How long ago `then` was, in a word or two ("now", "5m", "3h", "2d"). */
export function agoLabel(then: number, now: number): string {
  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function FriendRow(props: { friend: Friend | undefined }) {
  const f = () => props.friend;
  return (
    <View accessibilityLabel={`${f()?.name ?? ""}: ${f()?.title ?? ""}`} class="h-14 flex-row items-center gap-3 px-3">
      <Cover src={f()?.userImage ?? ""} size={36} round fallback="user" />
      <View class="min-w-0 flex-1">
        <Text class="line-clamp-1 text-sm font-semibold text-foreground">{f()?.name ?? ""}</Text>
        <Text class="line-clamp-1 text-xs text-foreground">{f()?.title ?? ""}</Text>
        <Text class="line-clamp-1 text-xs text-muted-foreground">{f()?.subtitle ?? ""}</Text>
      </View>
      <If when={f()?.playing && !terminal} else={<Text class="text-xs text-muted-foreground">{agoLabel(f()?.timestamp ?? 0, Date.now())}</Text>}>
        <PlayingBars playing size={12} />
      </If>
    </View>
  );
}

/** The panel: a title with a button to fold it away, and the friends'
 * latest listens, newest first. */
export function FriendPanel() {
  const friends = friendsQuery();
  const list = () => friends.data() ?? [];
  return (
    <View accessibilityLabel="Friend Activity" class="min-h-0 flex-1 overflow-hidden rounded-(--radius-panel) border border-border bg-card">
      <View class="h-12 flex-row items-center justify-between pl-4 pr-2">
        <Text role="header" class="text-base font-bold text-foreground">
          Friend Activity
        </Text>
        <IconButton name="close" label="Close friend activity" hint onPress={toggleFriends} />
      </View>
      <If when={friends.error() && friends.data() === undefined} else={
        <If when={list().length > 0} else={
          <Text class="px-4 pt-2 text-sm text-muted-foreground">
            {friends.data() === undefined ? "" : "Follow friends on Spotify to see what they are listening to."}
          </Text>
        }>
          <List each={list()} keyExtractor={(f) => f.userId} estimatedItemSize={56} contentClass="pb-2" class="flex-1">
            {(friend) => <FriendRow friend={friend()} />}
          </List>
        </If>
      }>
        <ErrorState message="Friend activity didn't load." onRetry={friends.refetch} />
      </If>
    </View>
  );
}
