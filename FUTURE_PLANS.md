# Future Plans

Non-blocking polish and cleanup deferred past the 1.6.0 / 1.7.0 baseline on `main`. None are required for the current stable baseline.

## Optional: settings UI modernization

Consider migrating the settings tab to Svelte in a future branch. Potential benefits:
- Cleaner conditional UI via `{#if}` blocks instead of imperative `.empty()` + rebuild.
- Easier slide / fade animations on enable-toggle expansion.
- Less imperative DOM rebuilding overall.

Not needed for the current stable baseline; the per-section re-render approach already works well.

## Optional: active-file correctness for monthly / quarterly / yearly

`getDateUIDFromFile` (`src/ui/utils.ts`) currently only checks daily and weekly periodicities. If a future UI change adds active-state highlighting for month / quarter / year cells, extend the function to detect those file types as well. No visible regression today because the underlying calendar UI doesn't render an active state for those cells.

## Performance: incremental periodic-notes index updates

`getAllPeriodicNotes` in `src/io/periodicNoteHelpers.ts` rescans the entire configured folder on every `*.reindex()` call. With the current callers in `src/view.ts` (vault create/delete events and settings changes), a single file create in a large vault can trigger up to five full folder scans (one per enabled period). Negligible for typical vaults; can become noticeable at 50k+ files, especially when daily folder is the vault root.

Mitigations to consider:
- Incremental updates: on `vault.create`, just add the entry by computed UID; on `vault.delete`, just remove. Fall back to a full scan on settings change only.
- Debounce `reindex` calls within a short window (e.g. 100ms).
- Cache by `(folder, format)` and invalidate on settings change only.

## Optional: review view detach behavior on plugin unload

`src/main.ts:23-27` `onunload` detaches every `calendar-plus-view` leaf when the plugin unloads. This is inherited/upstream-style behavior and works correctly today, but many Obsidian plugins instead let their custom views persist as placeholders until the plugin is re-enabled (Obsidian renders an "Add plugin to re-enable" stub in the leaf). Worth investigating before changing — different plugin authors trade off "clean disappearance on disable" vs. "preserve layout slot on disable" differently, and the right call depends on what feels least surprising for Calendar Plus users.

No urgency; current behavior is stable.

## Optional: evaluate Obsidian API dependency pinning

`package.json` currently pulls `obsidian` from `obsidianmd/obsidian-api#master` — the same git-ref pattern every Obsidian plugin uses. It resolves to the latest API d.ts at install time, which is convenient but means a CI build today and a CI build a month later could compile against slightly different `obsidian.d.ts` versions. Reproducibility-conscious projects pin to a tag (e.g. `obsidianmd/obsidian-api#v1.7.0`). The d.ts rarely changes in breaking ways, so the floating ref is generally safe.

Defer unless publishing or CI reproducibility becomes a concern.
