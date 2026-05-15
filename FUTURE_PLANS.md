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

After the 1.7.12 release, the Obsidian community-plugin checker reports **zero blocking Errors** and roughly **34 non-blocking Source Code warnings**. These warnings cluster into five root causes — none block submission, none are user-visible, and each has a known follow-up path that is intentionally deferred until we choose to invest in another focused warning-cleanup pass. Group items here rather than chasing individual line-numbers; the bot's specific line counts shift slightly across releases.

### 1. Moment / type-resolution warnings

The checker reports unresolved or "error-typed" warnings around Moment values in:
- `src/io/periodicNoteHelpers.ts`
- `src/main.ts`
- `src/ui/calendar-ui/localization.ts`
- `src/ui/calendar-ui/utils.ts`

Representative messages: "Unsafe assignment of an error typed value", "Unsafe call of a type that could not be resolved", "Unsafe member access `.get` / `.format` / `.isValid` / `.locale` on an unresolved type", "Unsafe argument of error typed value assigned to `string` / `Moment` / `LocaleSpecifier`", "Unsafe return of a value of type error", and the central-seam "restricted type-only import from `'moment'` in `src/types/moment.ts`".

Reasoning:
- Runtime moment usage now imports from `"obsidian"` and Calendar Plus does **not** reintroduce `window.moment` runtime access. Do not regress that.
- `src/types/moment.ts` is intentionally the single type-only seam for precise `Moment` / `Locale` / `WeekSpec` / `DurationUnit` types — accept the one restricted-import warning on that file in exchange for keeping consumer files clean.
- 1.7.10 attempted to derive `Moment` as `ReturnType<typeof moment>` (where `moment` came from `"obsidian"`) precisely to avoid the `"moment"` import. The Obsidian checker's TypeScript could not resolve through Obsidian's `import * as Moment from 'moment'` re-export and treated Moment instances as `any` / "error", which inflated the warning count by ~56. Reverted in 1.7.11. 1.7.12 then removed the `// eslint-disable-next-line no-restricted-imports` directive on the central seam (the Obsidian checker forbids that disable), accepting the single restricted-import warning instead.
- The deeper fix is to hand-roll a local `Moment` interface (and a `MomentFactory` / `Locale` interface) inside `src/types/moment.ts`, and route all runtime `moment` imports through that typed local seam (so consumer files do `import { moment } from "src/types/moment"` instead of `from "obsidian"`). That eliminates the cascade because the bot no longer needs to resolve through Obsidian's transitive `'moment'` re-export.
- Cost: ~50 lines of hand-rolled interface definitions covering the 16 Moment instance methods and 6 MomentFactory methods Calendar Plus uses, plus a mechanical import-path change across ~15 source files. Risk: missing an overload or a method that a future caller needs (manageable — extend the interface as needed).
- Defer until we want a dedicated 1.7.13-style warning-cleanup pass.

### 2. Language detection / localStorage warning

The checker reports two related warnings on the same line in `src/ui/calendar-ui/localization.ts`:
- "Unexpected use of `localStorage`. Prefer `App#saveLocalStorage` / `App#loadLocalStorage`."
- "Use Obsidian's `getLanguage()` instead of `localStorage.getItem('language')` to detect the user's language."

Reasoning:
- `App.getLanguage()` is **not** available in the currently pinned Obsidian API d.ts (commit `23947b58…`, version 1.7.2).
- Resolving these two warnings is paired with bumping the pinned Obsidian API dependency. That bump has its own risk profile (new APIs may surface new lint warnings, removed APIs would surface as type errors) and should be a focused, separately-validated change.
- Revisit only when intentionally upgrading the pin. Do not treat as a quick fix without verifying API availability against the new pin.

### 3. ILocaleOverride union warning

The checker reports one warning in `src/ui/calendar-ui/localization.ts`:
- `"system-default" is overridden by string in this union type.`

Reasoning:
- The type `export type ILocaleOverride = "system-default" | string;` flattens to plain `string` because the literal is a subtype of `string`. This is type-shape noise rather than a behavioral issue.
- Possible fix: replace with a branded-string pattern such as `"system-default" | (string & {})` so the literal is preserved alongside an opaque-string variant. Verify that downstream comparisons and the settings save/load round-trip still read clearly and behave identically.
- Low priority. Single line of impact.

### 4. Utility `any[]` return warning in calendar-ui/utils.ts

The checker reports one warning in `src/ui/calendar-ui/utils.ts`:
- "Unsafe return of a value of type `any[]`."

Reasoning:
- Likely a local typing gap in `getMonth` (the function constructs an array via mutation in a loop and the implicit type widens). Investigate with a focused type pass — annotate the local accumulator and the return type explicitly.
- Keep this work separate from the broader Moment-typing pass above; it's a distinct, smaller cleanup.

### 5. Svelte component instance typing warnings

The checker reports several "Unsafe call of an `any` typed value" warnings in `src/view.ts` on calls against `this.calendar` (the Svelte `Calendar` component reference) — specifically `tick` / `$set` / `$destroy`.

Reasoning:
- Svelte 3's component-class type generation is loose by default; the methods are typed permissively enough that the checker's `no-unsafe-call` rule fires on every call. The underlying calls work at runtime and have for many releases.
- A proper fix needs one of: a thin typed wrapper around the generated `Calendar` Svelte component, a declaration-merge file that tightens the generated component types, or a Svelte tooling bump. Each option deserves its own focused investigation and validation pass.
- Revisit only if the Obsidian checker starts treating these warnings as blocking errors, or as part of a dedicated Svelte typing cleanup.
