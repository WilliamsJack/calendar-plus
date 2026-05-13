# Future Plans

Non-blocking polish and cleanup deferred past the 1.6.0 / 1.7.0 baseline on `main`. None are required for the current stable baseline.

## Optional: settings UI modernization (deferred)

Migrating the settings tab to Svelte would potentially give cleaner conditional UI (`{#if}` blocks instead of imperative `.empty()` + rebuild), easier slide / fade animations on enable-toggle expansion, and less imperative DOM rebuilding overall.

**Not planned.** The current per-section re-render in `src/settings.ts` works well, doesn't scroll-jump, and is straightforward to maintain. Only worth revisiting if the settings UI grows substantially harder to extend — until then this is a "nice to have" with no concrete trigger, kept here only as a parking lot for the idea.

## Optional: active-file correctness for monthly / quarterly / yearly (deferred)

`getDateUIDFromFile` (`src/ui/utils.ts`) currently only checks daily and weekly periodicities. Opening a monthly / quarterly / yearly note today produces a `null` active UID instead of e.g. `"month-2024-05-01T..."`.

**Not planned.** The active-file UID is only consumed by `Day.svelte` (compares against daily UIDs) and `WeekNum.svelte` (compares against weekly UIDs). `Nav.svelte` — which renders the month / year / quarter labels — does not receive `selectedId` as a prop and has no `class:active` binding driven by the active file. The existing `.active` class on quarter spans represents "this quarter contains the currently-displayed month" (a navigation-state concept), not "this is the active file's quarter." Extending the helper alone would compute UIDs that nothing currently compares against — dead code with no observable effect.

If a future change adds active-file styling to month / quarter / year labels, the work is two parts:
1. Extend `getDateUIDFromFile` to also check monthly, quarterly, yearly (~12 lines in `src/ui/utils.ts`).
2. Pass `selectedId` from vendored `Calendar.svelte` through to `Nav.svelte`, add `class:active-file` bindings on `.month` / `.year` / `.quarter` (or rename the existing quarter `.active` to disambiguate the two concepts), and decide a visual treatment that doesn't conflate "displayed quarter" with "active-file quarter."

Revisit only if visible active styling for header labels is wanted. Until then, the current behavior is internally consistent: cells (Day, WeekNum) highlight, header labels don't.

## Optional: evaluate Obsidian API dependency pinning

`package.json` currently pulls `obsidian` from `obsidianmd/obsidian-api#master` — the same git-ref pattern every Obsidian plugin uses. It resolves to the latest API d.ts at install time, which is convenient but means a CI build today and a CI build a month later could compile against slightly different `obsidian.d.ts` versions. Reproducibility-conscious projects pin to a tag (e.g. `obsidianmd/obsidian-api#v1.7.0`). The d.ts rarely changes in breaking ways, so the floating ref is generally safe.

Defer unless publishing or CI reproducibility becomes a concern.
