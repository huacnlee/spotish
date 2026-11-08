// The home page: a shader-lit header, then Spotify's sections of the day.

import { resource, Scroll, Text, View } from "nsh";
import { cached } from "../ui/cache";
import { store } from "../ui/store";
import { CardRow, PageMessage } from "./common";
import { Ambient, coverColors } from "../ui/shader";
import { enter } from "../ui/motion";
import { isTerminal } from "../ui/controls";
import type { Home as HomeData } from "../ui/types";

export function Home() {
  const home = cached<HomeData>(() => "home", () => store.spotify.home() as Promise<HomeData>);
  // The ambient tint comes from the playing cover's own extracted color.
  const tint = resource(
    () => store.player().artwork,
    async (url) => (url ? ((await store.spotify.colors(url)) as { hex: string }).hex : ""),
  );
  const colors = () => coverColors(tint() ?? "", store.player().trackUri);
  return (
    <Scroll class="flex-1">
      {/* A living, track-tinted aurora behind the greeting — NSH drawing a
          live WGSL shader under native views. */}
      <View class="relative">
        <If when={!isTerminal}>
          <View class="absolute left-0 right-0 top-0 h-[260px] opacity-60">
            <Ambient colors={colors} />
          </View>
          <View class="absolute left-0 right-0 top-0 h-[260px] bg-gradient-to-b from-transparent to-background" />
        </If>
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
      </View>
    </Scroll>
  );
}
