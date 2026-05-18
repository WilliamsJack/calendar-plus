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

## Resolve remaining Obsidian plugin warnings (deferred)

After 1.7.14, the Obsidian community-plugin checker reports **zero blocking Errors** and a substantially narrower set of non-blocking Source Code warnings than the 1.7.12 baseline. 1.7.13 cleared the Moment-resolution cascade across `periodicNoteHelpers.ts` / `main.ts` / `localization.ts` / `utils.ts`, the `ILocaleOverride` literal-union flatten, the `getMonth` `any[]` return, and the two `const { moment } = window;` destructures in `src/settings.ts`. 1.7.14 replaced the single `localStorage.getItem("language")` call with Obsidian's `getLanguage()` API (paired with a pinned d.ts bump to v1.8.7 and a `minAppVersion` bump to 1.8.7), clearing the Local Storage behavior recommendation. The remaining Source Code warnings cluster into two root causes — none block submission, none are user-visible, and each has a known follow-up path that is intentionally deferred.

### 1. Type-only `"moment"` import in `src/types/moment.ts`

The checker continues to report one non-blocking `no-restricted-imports` warning on `src/types/moment.ts:2`:
- `import type { Locale, Moment, unitOfTime } from "moment";`

Reasoning:
- This is the single type-only seam that lets the Obsidian checker resolve `Moment` and `Locale` precisely. Without it, the checker's TypeScript can't follow Obsidian's `import * as Moment from 'moment'` re-export — every Moment instance access cascades into `unsafe-*` warnings (as 1.7.10 demonstrated when we tried `ReturnType<typeof moment>` and the warning count jumped by ~56).
- 1.7.13 paired this type seam with a typed runtime seam: `src/types/moment.ts` also exports a `moment` value cast to a local `MomentFactory` interface. All six runtime moment consumers (plus the two former `const { moment } = window;` destructures in `src/settings.ts`) now import the runtime `moment` from `src/types/moment` instead of from `"obsidian"`. Runtime moment still comes from Obsidian's bundled `moment` export — the cast is type-only.
- The deeper alternative — hand-rolling local interfaces for `Moment` and `Locale` so the source tree has zero `"moment"` imports at all — remains an option but is no longer urgent. Cost: ~50 lines of hand-rolled interface definitions covering the 16 Moment instance methods Calendar Plus uses. Risk: missing an overload or a method a future caller needs (manageable — extend the interface as needed).
- Revisit only if the Obsidian checker escalates the type-only import warning to a blocking Error, or as part of a future "zero `moment` imports" cleanup.

### 2. Svelte component instance typing warnings

The checker reports several "Unsafe call of an `any` typed value" warnings in `src/view.ts` on calls against `this.calendar` (the Svelte `Calendar` component reference) — specifically `tick` / `$set` / `$destroy`.

Reasoning:
- Svelte 3's component-class type generation is loose by default; the methods are typed permissively enough that the checker's `no-unsafe-call` rule fires on every call. The underlying calls work at runtime and have for many releases.
- A proper fix needs one of: a thin typed wrapper around the generated `Calendar` Svelte component, a declaration-merge file that tightens the generated component types, or a Svelte tooling bump. Each option deserves its own focused investigation and validation pass.
- Revisit only if the Obsidian checker starts treating these warnings as blocking errors, or as part of a dedicated Svelte typing cleanup.

## Accepted Obsidian checker behavior recommendations

After 1.7.14 the checker has no source-code Errors and reports a small residual set of warnings (see the section above). The two **Behavior** recommendations it reports separately are deliberate architectural choices documented below so future sessions don't try to "fix" them without understanding the trade-off.

### Vault enumeration — required for note-existence dots and settings autocomplete

The checker flags Calendar Plus as a plugin that enumerates the vault. The flagged call sites are:
- `Vault.recurseChildren(folderObj, ...)` in `getAllPeriodicNotes` (`src/io/periodicNoteHelpers.ts:363`) — `folderObj` is `vault.getRoot()` when the user has left the per-period folder field empty.
- `this.app.vault.getAllLoadedFiles()` in `FolderSuggest` and `FileSuggest` (`src/ui/file-suggest.ts:13` and `:45`).

Why this is intentional:
- **Note-existence dots are the plugin's main feature.** `getAllPeriodicNotes` walks the configured periodic-note folder (or the vault root if the user left the folder field empty) to find files whose basenames match the user's Moment date-format string. Without this enumeration, dots disappear and the calendar loses its primary signal.
- **Already scoped when possible**: if the user configures a folder (e.g. `Notes/Daily`), `recurseChildren` is called on that folder only — not the vault root. Heavy users with organized vaults already get scoped behavior; the only full-vault case is when the user leaves the folder field blank.
- **Already bounded in frequency**: enumeration runs once per periodicity at view-mount, and once per affected periodicity when settings change. It does **not** run per frame or per file event. Per-event updates use incremental `addFile` / `removeFile` / `removeByOldPath` store mutations.
- **Folder and template autocomplete in settings** uses `vault.getAllLoadedFiles()` per keystroke — required to make the autocomplete dropdown responsive. Caching per-modal-session would save a few calls but doesn't change the checker classification.

Alternatives considered and rejected:
- Requiring users to set a folder (never scan root) — UX regression for existing users.
- Removing folder/template autocomplete — major UX regression in settings.
- Using `MetadataCache` instead of the vault scan — `metadataCache.getFileCache(file)` still requires a `TFile`, so it doesn't avoid enumeration.

**Accepted as an architectural trade-off.** Revisit only if Obsidian introduces a scoped-discovery API that meets the same requirements, if large-vault performance becomes a real issue in practice, or if the checker escalates this from a recommendation to a blocking error.
