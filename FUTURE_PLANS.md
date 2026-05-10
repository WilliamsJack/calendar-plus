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

## Migrate deprecated Obsidian workspace APIs

A few call sites still use Obsidian APIs that have been deprecated for several versions but continue to function. Worth migrating before the deprecations are removed.

- `app.workspace.activeLeaf` in `src/view.ts` (`updateActiveFile`, `revealActiveNote`). Modern API: `workspace.getMostRecentLeaf()` or `workspace.getActiveViewOfType(...)`. Both call sites also assume `activeLeaf` is non-null and would throw otherwise — worth guarding during the migration.
- `workspace.splitActiveLeaf()` and `workspace.getUnpinnedLeaf()` in `src/view.ts` (monthly/quarterly/yearly handlers) and in `src/io/{monthly,quarterly,yearly}Notes.ts`. Modern API: `workspace.getLeaf("split", "vertical")` and `workspace.getLeaf(false)`. The daily and weekly handlers in `view.ts` already use the modern API — this migration also fixes that inconsistency.

No behavior change expected; just future-compatibility.

## Serialize rapid same-date note creation

`src/view.ts` calls `tryToCreate*Note(...)` *without* awaiting in the `openOrCreate*Note` handlers and then `return`s. With `shouldConfirmBeforeCreate: false`, two rapid clicks on the same day cell race: both reach `vault.create(path, ...)` before the first resolves, and the second throws "file already exists" → the user sees a stray `Notice("Unable to create new file.")`.

Not a data-loss bug — `vault.create` refuses to overwrite. Just a UI nuisance. Mitigations:
- Await `tryToCreate*Note(...)` in the handlers, OR
- Maintain a small per-date in-flight `Set<string>` keyed by date UID and short-circuit duplicate calls.

Pre-existing from upstream Calendar; low priority.
