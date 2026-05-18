# CLAUDE.md

Read this before making changes. It captures project state, intentional decisions, and known non-blocking issues so you don't re-derive context or undo prior work.

## Project overview

- Calendar Plus is an Obsidian plugin: a fork / new plugin based on Liam Cain's Calendar plugin, with integrated periodic note functionality inspired by Periodic Notes.
- Intentionally a **separate** plugin from the original Calendar plugin — both can be installed and enabled simultaneously.
- Plugin id: `calendar-plus`
- User-facing name: `Calendar Plus`
- Current version: `1.7.13` (kept in sync across `manifest.json`, `package.json`, `package-lock.json`, `versions.json`)
- **Active branch is `main`.** Calendar Plus 1.7.13 is the current stable local baseline and lives on `main`. Earlier sessions worked on a `merge-periodic-notes` branch that has since been promoted to `main` — that name is no longer the working branch. If a branch named `old-main` exists, treat it as archival/reference only (the pre-merge upstream state); do not commit to it or use it as a base for new work.

## Important product decisions

- **No backwards compatibility.** Do not write migration code, fallbacks, or compatibility shims for: the original Calendar plugin, the Periodic Notes plugin, Obsidian core Daily Notes settings, or any old data shape. Calendar Plus assumes a clean-slate settings model.
- Calendar Plus owns daily, weekly, monthly, quarterly, and yearly periodic-note settings directly. It does **not** read from Obsidian's core Daily Notes plugin or the Periodic Notes plugin.
- Dots have exactly one meaning: a periodic note exists for that day/week. No word-count dots, no task dots, no "Words per dot" setting. Don't reintroduce them.
- The plugin must coexist with the original Calendar plugin without collisions (separate view type, separate event namespace, separate manifest id).

## Current architecture

- **Manifest** (`manifest.json`): id `calendar-plus`, name `Calendar Plus`, minAppVersion `0.9.11`. (Current version is in the Project overview above.)
- **Internal namespaces** (`src/constants.ts`):
  - `VIEW_TYPE_CALENDAR = "calendar-plus-view"`
  - `TRIGGER_ON_OPEN = "calendar-plus:open"` (event external plugins listen on to inject sources)
- **Settings** (`src/settings.ts`): `CalendarSettingsTab` extends `PluginSettingTab`. Periodic-note sections are rendered into per-section wrapper divs via `renderPeriodicNoteSection(sectionEl, ...)`, so toggling Enable re-renders only that section (no full-tab rebuild, no scroll jump).
- **Periodic note helpers** (`src/io/periodicNoteHelpers.ts`): pure path/format/parse helpers + vault scan. Includes `getDateFromFilename`, `getPeriodicNotePath`, `applyTemplateTokens`, `getAllPeriodicNotes`, `getDateUID`, `getPeriodicNote`, `ensureParentFolderExists`, `getTemplateInfo`.
- **Shared creation logic** (`src/io/periodicNotes.ts`): `createPeriodicNote(...)` and `tryToCreatePeriodicNote(...)` (handles confirm-before-create modal).
- **Per-period wrapper files** (`src/io/{daily,weekly,monthly,quarterly,yearly}Notes.ts`): each exports a `tryToCreate*Note` that delegates to `tryToCreatePeriodicNote` and handles the open-leaf flow. They exist for naming clarity at call sites.
- **Stores** (`src/ui/stores.ts`): module-level Svelte writables for `settings`, `dailyNotes`, `weeklyNotes`, `monthlyNotes`, `quarterlyNotes`, `yearlyNotes`, `activeFile`. Each per-period store has a `reindex()` method that rescans the configured folder.
- **View / lifecycle** (`src/view.ts`): `CalendarView` extends `ItemView`. Owns the Svelte `Calendar` component, vault file events, settings subscription (registered via `this.register(...)` so it cleans up on view detach), and the periodic-note open/create methods.
- **Plugin registration / commands** (`src/main.ts`): `CalendarPlugin` extends `Plugin`. Registers the view, ribbon icon, and three commands (`show-calendar-view`, `open-weekly-note`, `reveal-active-note`). Commands look up the live view fresh via `getCalendarView()` / `ensureCalendarView()` helpers — no stale `this.view` reference.
- **Calendar UI**: vendored under `src/ui/calendar-ui/` (`components/*.svelte` plus `localization.ts`, `metadata.ts`, `types.ts`, `utils.ts`). Origin: the patched `obsidian-calendar-ui` 0.3.12 source (the patch added quarter navigation, clickable month/year/quarter labels, weekend col classes, and week-num grid borders + active state). The npm dependency and the `patches/obsidian-calendar-ui+0.3.12.patch` file have been removed. `Day.svelte` and `WeekNum.svelte` use the local `getDateUID` from `src/io/periodicNoteHelpers` (with `"daily"` / `"weekly"` periodicity) instead of `obsidian-daily-notes-interface`, which is no longer a transitive dep. Component-internal CSS now lives inside each vendored component's `<style>` block; `styles.css` retains only the wrapper-state-dependent rules (depend on `.daily-enabled`/`.monthly-enabled`/etc. on the outer Calendar Plus wrapper) and the `.calendar-plus-suggest` rule for the document-body-attached settings autocomplete.
- **Autocomplete** (`src/ui/suggest.ts`, `src/ui/file-suggest.ts`): folder/template path autocomplete in settings. No-Popper implementation ported from the Daily Checklist plugin: positioning is `getBoundingClientRect()` + inline `position: fixed`, with capture-true `scroll` and `resize` listeners attached on open and detached on close. Single `TextInputSuggest<T>` class; `FolderSuggest` / `FileSuggest` keep a 2-arg `(app, inputEl)` constructor; `selectSuggestion` still uses `inputEl.trigger("input")` so the existing `Setting.addText(...).onChange(...)` path in `settings.ts` saves on selection. Container carries both `suggestion-container` (Obsidian theme classes) and `calendar-plus-suggest` (namespace hook for `styles.css`).

## Important implementation notes

- **Do not edit bundled `main.js` directly.** Always edit source under `src/` and run `npm run build`. The bundled file is a build artifact.
- **Use npm**, not yarn. The lockfile of record is `package-lock.json`. This repo intentionally does not include `yarn.lock`; do not re-introduce it.
- **Baseline build warnings exist** from `svelte-check` (mappings.wasm fires once per `.svelte` file) and TypeScript reading `node_modules/obsidian/obsidian.d.ts` and `node_modules/@codemirror/view/dist/index.d.ts`. These are pre-existing and unrelated to source changes. Don't chase them unless your edits actually involve those files.
- **Run `git status` before and after changes** so you can confirm the diff matches intent.
- **Keep commits small and focused.** One logical change per commit. Each commit's diff should fit on a screen.
- **Do not run `npm audit fix`.** It can rewrite the lockfile and break the patched dependency setup.
- **Do not commit unless explicitly asked.** Show the diff summary and wait.

## Recent important fixes (1.6.0)

In rough order:

- Removed direct dependency on `obsidian-daily-notes-interface`.
- Consolidated periodic note creation into `src/io/periodicNotes.ts`; per-period files are thin wrappers.
- Added folder/template autocomplete in settings (ported from periodic-notes).
- Fixed `this.calendar.tick is not a function` crash on settings change — root cause was a leaked `settings.subscribe` in `CalendarView` constructor; now wrapped in `this.register(...)` plus a `typeof` guard at the call site.
- Guarded command callbacks (`open-weekly-note`, `reveal-active-note`) against missing or stale `CalendarView` — now look up the live view fresh per invocation; `open-weekly-note` mounts the view if needed, `reveal-active-note` no-ops if absent.
- Initialized `window._bundledLocaleWeekSpec` from settings tab `display()` via `configureGlobalMomentLocale(...)` so the settings tab can render before the calendar view has mounted.
- Deep-merged saved per-period settings on load so a partial `data.json` can't wipe `format`/`folder`/`template` defaults (would have caused `"Invalid date"` filename collisions).
- Settings periodic-note sections re-render only their own wrapper div on toggle (no full-tab rebuild → no scroll jump).
- Added Calendar Plus ribbon icon; clicking reveals the existing leaf or creates one.
- Visual affordance refinements: cursor/hover behavior gated by enabled-class wrappers (`monthly-enabled`, etc.), TODAY/arrow hover opacity, suppressed transient `.day:active` purple flash, weekend column shading via `--color-background-weekend`, week-num font-size matched to day numbers, dot-container reservation to prevent week-num jitter, `localeData` spread to a fresh object so `<svelte:options immutable />` re-renders weekend cols on weekStart change.

## Known baseline / non-blocking issues

These are catalogued in `FUTURE_PLANS.md`. Highlights:

- `styles.css` is intentionally limited to wrapper-state-dependent rules (gated on `.daily-enabled` / `.monthly-enabled` / `.yearly-enabled` / `.quarterly-enabled` classes set on the outer Calendar Plus wrapper) and the `.calendar-plus-suggest` rule for the autocomplete dropdown attached to `document.body`. Component-internal styling already lives inside each vendored Svelte component's `<style>` block.

None of the above blocks shipping.

## Future plans

See `FUTURE_PLANS.md` for full descriptions. Short list:

- **Optional: active-file correctness for monthly / quarterly / yearly (deferred)** — `getDateUIDFromFile` only handles daily / weekly. Nav.svelte doesn't consume `selectedId` for month / year / quarter labels, so M/Q/Y active UIDs would be dead code today. Revisit only if active-file styling for header labels is wanted.
- **Optional: Svelte settings migration (deferred)** — cleaner conditional UI, slide animations. Not planned; the current per-section re-render in `src/settings.ts` works well. Revisit only if the settings UI becomes harder to extend.
- **Optional: Resolve remaining Obsidian plugin warnings (deferred)** — after 1.7.13 the checker reports zero Errors and a substantially narrower warning set than the 1.7.12 baseline (1.7.13 cleared the Moment-resolution cascade, the `ILocaleOverride` literal-union flatten, the `getMonth` `any[]` return, and the two `settings.ts` `const { moment } = window;` destructures). Three root causes remain: the intentional single `no-restricted-imports` warning on `src/types/moment.ts:2` (the type-only seam that lets the checker resolve `Moment` precisely); `localStorage` → `getLanguage()` paired with the Obsidian d.ts pin bump; and Svelte component instance typing on `this.calendar.tick` / `$set` / `$destroy` in `view.ts`. Each is documented with a follow-up path in `FUTURE_PLANS.md`. Revisit as a dedicated cleanup pass.

## Release prep

When the user explicitly asks to bump the plugin version, treat the changelog as part of the same release-prep task unless the user says otherwise. Update these five files together in the same commit:

- `manifest.json` — `version`
- `package.json` — `version`
- `package-lock.json` — both `version` fields (top-level + the root `packages[""]` entry)
- `versions.json` — add `"<new-version>": "<minAppVersion>"`
- `CHANGELOG.md` — add a `## <new-version>` section at the top, summarizing user-facing changes, major refactors, dependency removals, and notable bug fixes since the previous version

Changelog content guidance:
- Lead with what the user will notice. Group related items under short headings if the section is long (see the 1.6.0 entry as a template).
- Mention dependency additions/removals and architectural refactors when they're release-significant, even if user-invisible — future-you will want the context.
- Skip implementation paths and internal symbol names unless they aid debugging.

Proposing version bumps:
- For major user-facing features, major refactors, dependency changes, or other release-significant cleanup, mention in your plan whether a changelog entry and version bump are warranted, and flag the proposed version (major / minor / patch) so the user can confirm.
- For small fixes, do not silently invent a new version number or changelog entry. Ask, or flag the bump as optional if unclear.
- Do not commit the version bump unless the user explicitly asks.

## Suggested workflow for future Claude sessions

1. **Read this file first.** Then read `FUTURE_PLANS.md` if the user's request touches deferred work.
2. **Run `git status`** to see what's already in flight before editing.
3. **Inspect the relevant files** before editing — don't assume they match a memory of an earlier session.
4. **Make one focused change at a time.** Match the scope of the user's request; don't bundle unrelated cleanup.
5. **Run `npm run build`** after each change. Confirm `created main.js` and that any warnings are pre-existing baseline noise (not in your changed files).
6. **Report the diff summary** (`git diff <files>`) and explain what changed and why.
7. **Do not commit** unless the user explicitly asks. Wait for the next instruction.
