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

## Migrate `layout-ready` event to `workspace.onLayoutReady`

`src/main.ts` uses `workspace.on("layout-ready", this.initLeaf.bind(this))` to mount the calendar view once the workspace is ready on plugin load. The `"layout-ready"` event name is no longer documented in the current `obsidian.d.ts` (the modern API surfaces `Workspace.onLayoutReady(callback)` instead). The legacy event name likely still functions for backwards compatibility, but it's an undocumented surface that could disappear in a future Obsidian release.

Migration:
- Replace the `workspace.on("layout-ready", ...)` registration with `workspace.onLayoutReady(() => this.initLeaf())`.
- `onLayoutReady` is fire-once and idempotent — if layout is already ready, the callback fires immediately. That matches the existing `if (this.app.workspace.layoutReady) { this.initLeaf(); } else { ... }` branching, so the surrounding `if/else` can collapse into a single `onLayoutReady` call.

No behavior change expected.

## Remove dead Jest test scaffolding

The repo carries inert test infrastructure with no tests against it:
- `src/testUtils/mockApp.ts`, `src/testUtils/settings.ts`, `src/ui/__mocks__/obsidian.ts` — unreferenced by any source file.
- `package.json` carries a `"jest"` config block, `"test"` and `"test:watch"` scripts, and the `@types/jest` / `jest` / `svelte-jester` / `ts-jest` devDependencies.
- `"test:watch": "yarn test -- --watch"` contradicts the "use npm, not yarn" rule.

`getDefaultSettings` in `src/testUtils/settings.ts` doesn't return a valid `ISettings` (missing `daily`/`weekly`/etc.), so it would fail any real test anyway. Either wire up real tests or delete the scaffolding; the latter is the right call unless there's appetite for writing tests.

## Drop unused `patch-package` dependency

`patch-package` is still a runtime dependency and a `postinstall` script even though the `patches/` directory was removed in 1.7.0. Every install runs the script and harmlessly logs `No patch files found`. Could be dropped from `dependencies` and from `scripts.postinstall` entirely — saves one transitive dep and one log line per install. Keep only if you expect to maintain dependency patches again.

## Performance: incremental periodic-notes index updates

`getAllPeriodicNotes` in `src/io/periodicNoteHelpers.ts` rescans the entire configured folder on every `*.reindex()` call. With the current callers in `src/view.ts` (vault create/delete events and settings changes), a single file create in a large vault can trigger up to five full folder scans (one per enabled period). Negligible for typical vaults; can become noticeable at 50k+ files, especially when daily folder is the vault root.

Mitigations to consider:
- Incremental updates: on `vault.create`, just add the entry by computed UID; on `vault.delete`, just remove. Fall back to a full scan on settings change only.
- Debounce `reindex` calls within a short window (e.g. 100ms).
- Cache by `(folder, format)` and invalidate on settings change only.

## Cap and sort settings-tab autocomplete results

`FolderSuggest` and `FileSuggest` in `src/ui/file-suggest.ts` iterate `getAllLoadedFiles()` on every keystroke and render every match. For a 50k-file vault that's 50k iterations + potentially 50k DOM nodes per dropdown. The Daily Checklist reference implementation we ported from in 1.7.0 had `.sort((a,b) => a.path.localeCompare(b.path))` and `.slice(0, 200)`; we left them out to preserve exact behavior. Reintroducing both is a four-line, behavior-improving change.

## Polish: tighten tag-attribute emission in `tags.ts`

`src/ui/sources/tags.ts:40-44` always emits `data-tags=""` on day cells without tags because the truthy check is on an array reference rather than `.length`. Themes targeting `[data-tags]` will spuriously match every day cell. Replace `if (nonEmojiTags)` / `if (emojiTags)` with `if (nonEmojiTags.length)` / `if (emojiTags.length)`.

## Polish: clean up `package-lock.json` extraneous workspace entries

Four `"extraneous": true` entries near the top of `package-lock.json` reference sibling-checkout workspace paths (`../obsidian-calendar-ui`, `../../../../obsidian-calendar-ui`) and declare `@popperjs/core` / `@popperjs/svelte` / `obsidian-daily-notes-interface` as deps of those orphans. Not real installed packages; just lockfile noise carried over from before the 1.7.0 vendoring. Could be scrubbed in a focused `chore:` commit; no functional impact.
