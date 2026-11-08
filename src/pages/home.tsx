// Home: the greeting, then the sections of the day.

import { List, Text, View } from "nsh";
import { pageEnd } from "../components/layout";
import { homeQuery } from "../data/queries";
import { CardRow } from "../components/library/cards";
import { CardsSkeleton, ErrorState } from "../components/ui/feedback";
import { terminal } from "../components/ui/controls";
import { enter } from "../components/ui/motion";
import { AppPage } from "../components/page";

function Greeting(props: { text: string }) {
  return (
    <Text role="header" class="px-3 text-4xl font-extrabold text-foreground" style={terminal ? undefined : enter("fadeInUp")}>
      {props.text}
    </Text>
  );
}

export function HomePage() {
  const home = homeQuery();
  return (
    <AppPage title="Home" testID="page-home">
      {/* Virtualized both ways: the sections down the page are a list, and
          each section's cards a list across, so only what is near the view
          exists. */}
      <If
        when={home.data()}
        else={
          <View class={terminal ? "gap-1" : `gap-8 px-3 ${pageEnd()}`}>
            <Greeting text="Home" />
            <If when={home.error()} else={<CardsSkeleton />}>
              <ErrorState message="Home didn't load." onRetry={home.refetch} />
            </If>
          </View>
        }
      >
        {(data) => (
          <List
            each={data().sections}
            keyExtractor={(s) => s.title}
            estimatedItemSize={terminal ? 4 : 270}
            class="flex-1"
            contentClass={terminal ? "" : "px-3"}
            header={() => <Greeting text={data().greeting || "Home"} />}
            footer={() => <View class={pageEnd()} />}
          >
            {(section, i) => (
              <If when={section()}>
                {(s) => <CardRow title={s().title} items={s().items} delay={80 + Math.min(i(), 6) * 70} class={terminal ? "" : "pt-8"} />}
              </If>
            )}
          </List>
        )}
      </If>
    </AppPage>
  );
}
