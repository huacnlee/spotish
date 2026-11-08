// TEMPORARY memory benchmark, not to be committed.
import { backend } from "./state/engine";
import { HOME, open, switchTo } from "./nav";

export function runBench() {
  setTimeout(async () => {
    const lib = await backend.library();
    const items = lib.items.filter((i) => i.uri.includes(":playlist:") || i.uri.includes(":artist:") || i.uri.includes(":album:") || i.kind === "collection");
    console.log(`bench: ${items.length} pages`);
    for (const item of items) {
      open({ name: "collection", uri: item.uri });
      await new Promise((r) => setTimeout(r, 3000));
    }
    switchTo(HOME);
    await new Promise((r) => setTimeout(r, 4000));
    console.log("bench: done");
  }, 8000);
}
