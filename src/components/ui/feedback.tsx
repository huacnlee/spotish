// Feedback surfaces: the toasts, a page's error state, and the skeletons
// that stand in for content while it loads.

import { cleanup, createMotion, Overlay, safeArea, Text, View, windowSize } from "nsh";
import { Button, Toast, type ToastEntry, ToastStack } from "nsh/base";
import { choose, dismiss, dismissNewest, setToastsExpanded, toastContent, toasts } from "../../state/feedback";
import { ActionButton, focusRing, terminal } from "./controls";

function ToastItem(props: { entry: ToastEntry }) {
  const content = () => toastContent(props.entry.id);
  return (
    <Toast
      transitionStatus={props.entry.status}
      accessibilityLabel={content()?.text ?? ""}
      onDismissRequest={() => dismiss(props.entry.id)}
      swipeDirection={terminal ? null : "right"}
      class={
        terminal
          ? "flex-1 flex-row items-center gap-2 px-1"
          : "flex-row items-center gap-3 rounded-(--radius-card) border border-border bg-popover px-4 py-3 shadow-xl transition-all duration-300 ease-out motion-reduce:transition-none"
      }
      startingClass="opacity-0 translate-y-8 scale-90"
      endingClass="opacity-0 translate-x-12 scale-95"
      swipingClass="transition-none"
    >
      <Text class={terminal ? "flex-1 text-foreground" : "flex-1 text-sm font-medium text-popover-foreground"}>{content()?.text ?? ""}</Text>
      <If when={content()?.action}>
        {(action) => (
          <Button
            onPress={() => choose(props.entry.id)}
            class={`rounded-full px-3 py-1 active:opacity-60 ${terminal ? "" : "bg-primary"} ${focusRing}`}
          >
            <Text class={terminal ? "font-bold text-primary" : "text-sm font-bold text-primary-foreground"}>
              {terminal ? `[${action().label}]` : action().label}
            </Text>
          </Button>
        )}
      </If>
    </Toast>
  );
}

/** The toasts: at the bottom, inside the safe area, above the player (a
 * terminal's on its bottom row). */
export function Toaster(props: { bottomOffset?: number }) {
  const stack = (
    <ToastStack
      placement={windowSize().width < 640 ? "bottomCenter" : "bottomRight"}
      class={terminal ? undefined : "w-90 max-w-full"}
      onExpandedChange={({ expanded }) => setToastsExpanded(expanded)}
      onCancel={dismissNewest}
    >
      <Each of={toasts()} key={(e: ToastEntry) => e.id}>
        {(entry) => <ToastItem entry={entry()} />}
      </Each>
    </ToastStack>
  );
  if (terminal) return stack;
  return (
    <Overlay
      style={{
        pointerEvents: "box-none",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingBottom: safeArea().bottom + (props.bottomOffset ?? 16),
        alignItems: windowSize().width < 640 ? "center" : "flex-end",
      }}
    >
      {stack}
    </Overlay>
  );
}

/** A page that couldn't show its content: one plain sentence, and Retry. */
export function ErrorState(props: { message: string; detail?: string; onRetry: () => void }) {
  return (
    <View role="alert" class="items-center gap-3 px-6 py-16">
      <Text class="text-center text-lg font-bold text-foreground">{props.message}</Text>
      <If when={props.detail}>
        <Text class="max-w-md text-center text-sm text-muted-foreground">{props.detail}</Text>
      </If>
      <ActionButton label="Retry" onPress={props.onRetry} />
    </View>
  );
}

/** A page's empty state: a short title and what to do. */
export function EmptyState(props: { title: string; detail?: string }) {
  return (
    <View class="items-center gap-2 px-6 py-16">
      <Text class="text-center text-lg font-bold text-foreground">{props.title}</Text>
      <If when={props.detail}>
        <Text class="max-w-md text-center text-sm text-muted-foreground">{props.detail}</Text>
      </If>
    </View>
  );
}

/** A block standing in for content that loads. */
/** A placeholder shape that breathes while content loads. */
function Block(props: { class: string }) {
  if (terminal) return <View class={`bg-muted ${props.class}`} />;
  const motion = createMotion();
  void motion.play("breathe", { duration: 1600, iterations: "infinite" });
  cleanup(() => motion.stop());
  return <View class={`rounded-(--radius) bg-muted ${props.class}`} style={motion.style} />;
}

/** Rows of cards loading. */
export function CardsSkeleton(props: { rows?: number }) {
  const rows = Array.from({ length: props.rows ?? 2 }, (_, i) => i);
  return (
    <View accessibilityLabel="Loading" class="gap-8 px-3" testID="skeleton">
      <Each of={rows}>
        {() => (
          <View class="gap-3">
            <Block class="mx-3 h-6 w-48" />
            <View class="flex-row gap-3 overflow-hidden px-3">
              <Each of={[0, 1, 2, 3, 4]}>{() => <Block class="size-32 shrink-0" />}</Each>
            </View>
          </View>
        )}
      </Each>
    </View>
  );
}

/** Track rows loading. */
export function RowsSkeleton(props: { rows?: number }) {
  const rows = Array.from({ length: props.rows ?? 8 }, (_, i) => i);
  return (
    <View accessibilityLabel="Loading" class="gap-2 px-6" testID="skeleton">
      <Each of={rows}>
        {() => (
          <View class="h-14 flex-row items-center gap-4">
            <Block class="size-10" />
            <View class="flex-1 gap-2">
              <Block class="h-3 w-1/2" />
              <Block class="h-3 w-1/3" />
            </View>
          </View>
        )}
      </Each>
    </View>
  );
}

/** A small spinner for work behind content that still shows (a search
 * running again). Still when the user asked for less motion. */
export function Spinner(props: { label: string }) {
  if (terminal) return <Text class="text-muted-foreground">…</Text>;
  const motion = createMotion();
  void motion.play("spin", { duration: 900, iterations: "infinite", easing: "linear" });
  cleanup(() => motion.stop());
  return (
    <View
      role="progressbar"
      accessibilityLabel={props.label}
      class="size-4 rounded-full border-2 border-muted-foreground border-t-transparent"
      style={motion.style}
    />
  );
}
