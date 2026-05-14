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

## Optional: Obsidian API d.ts pin bump (deferred)

The pinned Obsidian API d.ts (commit `23947b58…`, version 1.7.2) lacks `App.getLanguage()`, which the Obsidian community-plugin review recommends as the replacement for `localStorage.getItem("language")` in `src/ui/calendar-ui/localization.ts`. That localStorage call is the only remaining "browser API restriction" warning in the source tree after the 1.7.10 cleanup pass.

**Not part of 1.7.10's cleanup; deferred.** The d.ts pin sets the entire type-only API surface Calendar Plus compiles against. Bumping it has its own risk profile — new APIs may surface new lint warnings, removed APIs would surface as type errors, and the change should be validated independently of any source-code work. Revisit when intentionally upgrading the pin; at that point, replace the `localStorage` lookup with `app.getLanguage()` (with a graceful fallback if the user is on an older Obsidian build).

## Optional: Svelte component instance typing (deferred)

Svelte 3's component-class type generation (`tick`, `$set`, `$destroy`, `$on`, instance refs) is loose by default — the methods are typed permissively enough that the Obsidian review's `@typescript-eslint/no-unsafe-*` rules flag every call against `this.calendar` in `src/view.ts`. These are framework-typing-generation warnings, not Calendar Plus correctness issues; the underlying calls all work at runtime and have for many releases.

**Not part of 1.7.10's cleanup; deferred.** A proper fix needs one of: a thin typed wrapper around the generated `Calendar` Svelte component, a declaration-merge file that tightens the generated component types, or a Svelte tooling bump. Each option deserves its own focused investigation and validation pass. Revisit only if Obsidian's review starts treating these warnings as blocking errors, or as part of a dedicated Svelte typing cleanup.
