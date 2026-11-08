// The home page: the greeting, then Spotify's sections of the day. The ambient
// backdrop is app-wide (App.tsx), so the page itself is transparent over it.

import { Scroll, Text, View } from "nsh";
import { cached } from "../ui/cache";
import { store } from "../ui/store";
import { CardRow, PageMessage } from "./common";
import { enter } from "../ui/motion";
import type { Home as HomeData } from "../ui/types";

export function Home() {
  const home = cached<HomeData>(() => "home", () => store.spotify.home() as Promise<HomeData>);
  return (
    <Scroll class="flex-1">
      <View class="gap-8 px-3 pb-8 pt-16">
        <Text class="px-3 text-4xl font-extrabold text-foreground" style={enter("fadeInUp", 0)}>
          {home.data()?.greeting || "Home"}
        </Text>
        <If
          when={home.data()}
          else={
            <If when={home.error()} else={<PageMessage title="Loading" detail="Fetching what's new for you…" />}>
              <PageMessage title="Home didn't load" detail={String(home.error())} />
            </If>
          }
        >
          {(data) => (
            <View class="gap-8">
              <Each of={data().sections} key={(s) => s.title}>
                {(section, i) => <CardRow title={section().title} items={section().items} delay={80 + i() * 70} />}
              </Each>
            </View>
          )}
        </If>
      </View>
    </Scroll>
  );
}
