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

## Cap and sort settings-tab autocomplete results

`FolderSuggest` and `FileSuggest` in `src/ui/file-suggest.ts` iterate `getAllLoadedFiles()` on every keystroke and render every match. For a 50k-file vault that's 50k iterations + potentially 50k DOM nodes per dropdown. The Daily Checklist reference implementation we ported from in 1.7.0 had `.sort((a,b) => a.path.localeCompare(b.path))` and `.slice(0, 200)`; we left them out to preserve exact behavior. Reintroducing both is a four-line, behavior-improving change.
