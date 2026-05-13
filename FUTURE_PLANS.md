# Future Plans

Non-blocking polish and cleanup deferred past the 1.6.0 / 1.7.0 baseline on `main`. None are required for the current stable baseline.

## Optional: settings UI modernization (deferred)

Migrating the settings tab to Svelte would potentially give cleaner conditional UI (`{#if}` blocks instead of imperative `.empty()` + rebuild), easier slide / fade animations on enable-toggle expansion, and less imperative DOM rebuilding overall.

**Not planned.** The current per-section re-render in `src/settings.ts` works well, doesn't scroll-jump, and is straightforward to maintain. Only worth revisiting if the settings UI grows substantially harder to extend — until then this is a "nice to have" with no concrete trigger, kept here only as a parking lot for the idea.

## Optional: active-file correctness for monthly / quarterly / yearly

`getDateUIDFromFile` (`src/ui/utils.ts`) currently only checks daily and weekly periodicities. If a future UI change adds active-state highlighting for month / quarter / year cells, extend the function to detect those file types as well. No visible regression today because the underlying calendar UI doesn't render an active state for those cells.

## Optional: review view detach behavior on plugin unload

`src/main.ts:23-27` `onunload` detaches every `calendar-plus-view` leaf when the plugin unloads. This is inherited/upstream-style behavior and works correctly today, but many Obsidian plugins instead let their custom views persist as placeholders until the plugin is re-enabled (Obsidian renders an "Add plugin to re-enable" stub in the leaf). Worth investigating before changing — different plugin authors trade off "clean disappearance on disable" vs. "preserve layout slot on disable" differently, and the right call depends on what feels least surprising for Calendar Plus users.

No urgency; current behavior is stable.

## Optional: evaluate Obsidian API dependency pinning

`package.json` currently pulls `obsidian` from `obsidianmd/obsidian-api#master` — the same git-ref pattern every Obsidian plugin uses. It resolves to the latest API d.ts at install time, which is convenient but means a CI build today and a CI build a month later could compile against slightly different `obsidian.d.ts` versions. Reproducibility-conscious projects pin to a tag (e.g. `obsidianmd/obsidian-api#v1.7.0`). The d.ts rarely changes in breaking ways, so the floating ref is generally safe.

Defer unless publishing or CI reproducibility becomes a concern.
