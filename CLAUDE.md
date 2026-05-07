# CLAUDE.md

Read this before making changes. It captures project state, intentional decisions, and known non-blocking issues so you don't re-derive context or undo prior work.

## Project overview

- Calendar Plus is an Obsidian plugin: a fork / new plugin based on Liam Cain's Calendar plugin, with integrated periodic note functionality inspired by Periodic Notes.
- Intentionally a **separate** plugin from the original Calendar plugin — both can be installed and enabled simultaneously.
- Plugin id: `calendar-plus`
- User-facing name: `Calendar Plus`
- Current version: `1.6.0` (kept in sync across `manifest.json`, `package.json`, `package-lock.json`, `versions.json`)

## Important product decisions

- **No backwards compatibility.** Do not write migration code, fallbacks, or compatibility shims for: the original Calendar plugin, the Periodic Notes plugin, Obsidian core Daily Notes settings, or any old data shape. Calendar Plus assumes a clean-slate settings model.
- Calendar Plus owns daily, weekly, monthly, quarterly, and yearly periodic-note settings directly. It does **not** read from Obsidian's core Daily Notes plugin or the Periodic Notes plugin.
- Dots have exactly one meaning: a periodic note exists for that day/week. No word-count dots, no task dots, no "Words per dot" setting. Don't reintroduce them.
- The plugin must coexist with the original Calendar plugin without collisions (separate view type, separate event namespace, separate manifest id).

## Current architecture

- **Manifest** (`manifest.json`): id `calendar-plus`, name `Calendar Plus`, version `1.6.0`, minAppVersion `0.9.11`.
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
- **Calendar UI**: comes from the `obsidian-calendar-ui` npm package (v0.3.12), shipped with a substantial `patch-package` patch (`patches/obsidian-calendar-ui+0.3.12.patch`) that adds quarter navigation, click handlers, and other features. CSS overrides in `styles.css` adjust styling that can't be addressed in the patched library.
- **Autocomplete** (`src/ui/suggest.ts`, `src/ui/file-suggest.ts`): folder/template path autocomplete in settings, ported from periodic-notes' suggest implementation, depends on `@popperjs/core`.

## Important implementation notes

- **Do not edit bundled `main.js` directly.** Always edit source under `src/` and run `npm run build`. The bundled file is a build artifact.
- **Use npm**, not yarn. The lockfile of record is `package-lock.json`. `yarn.lock` exists in the repo for historical reasons — **do not touch `yarn.lock`**, and never let `npm install` modify it (it sometimes does as a side effect; revert if so).
- **Baseline build warnings exist** from `svelte-check` (mappings.wasm) and TypeScript reading `node_modules/obsidian/obsidian.d.ts` and `obsidian-calendar-ui` declarations. These are pre-existing and unrelated to source changes. Don't chase them unless your edits actually involve those files.
- **Run `git status` before and after changes** so you can confirm the diff matches intent.
- **Keep commits small and focused.** One logical change per commit. Each commit's diff should fit on a screen.
- **Do not run `npm audit fix`.** It can rewrite the lockfile and break the patched dependency setup.
- **Treat `periodic-notes/` (sibling repo) as read-only reference material.** Read it for patterns; never write to it.
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

- README still has stale copy from upstream (word-count dots, "Show Week Numbers" toggle, identity strings).
- `.github/workflows/` has two near-duplicate release workflows with stale `PLUGIN_NAME` env values.
- `.github/FUNDING.yml` still funds the upstream author.
- Test scaffolding (`src/testUtils/`, `src/ui/__mocks__/obsidian.ts`, jest config in `package.json`) is dead — no tests exist. `getDefaultSettings` doesn't even return a valid `ISettings`.
- `obsidian-calendar-ui` is still a heavy dependency carrying a 399KB patch and several CSS overrides scoped via `.calendar-plus-wrapper #calendar-container` selectors.
- `src/ui/suggest.ts` Popper instance may leak per keystroke (inherited from periodic-notes upstream).

None of the above blocks shipping.

## Future plans

See `FUTURE_PLANS.md` for full descriptions. Short list:

- **Vendor `obsidian-calendar-ui` into Calendar Plus** in a future branch — would let us own UI source/styles/interactions directly and drop the patch + most CSS overrides.
- **README refresh** — strip removed-feature copy, refresh setting names and identity strings.
- **CI/release workflow cleanup** — consolidate to one workflow, fix `PLUGIN_NAME` to `calendar-plus`.
- **Funding metadata cleanup** — update `.github/FUNDING.yml`.
- **Optional: Svelte settings migration** — cleaner conditional UI, slide animations.
- **Optional: autocomplete Popper lifecycle cleanup** in `src/ui/suggest.ts`.
- **Optional: extend `getDateUIDFromFile`** to monthly/quarterly/yearly when active-file highlighting needs it.
- **Optional: midnight rollover fix** in `Calendar.svelte` (`isSame(today, "day")` → `"month"`).

## Suggested workflow for future Claude sessions

1. **Read this file first.** Then read `FUTURE_PLANS.md` if the user's request touches deferred work.
2. **Run `git status`** to see what's already in flight before editing.
3. **Inspect the relevant files** before editing — don't assume they match a memory of an earlier session.
4. **Make one focused change at a time.** Match the scope of the user's request; don't bundle unrelated cleanup.
5. **Run `npm run build`** after each change. Confirm `created main.js` and that any warnings are pre-existing baseline noise (not in your changed files).
6. **Report the diff summary** (`git diff <files>`) and explain what changed and why.
7. **Do not commit** unless the user explicitly asks. Wait for the next instruction.
