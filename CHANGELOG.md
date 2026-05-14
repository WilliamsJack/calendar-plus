# Changelog

## 1.7.11

Focus: regression fix for the 1.7.10 source-code warning cleanup. No intended user-visible behavior change.

What went wrong in 1.7.10
- 1.7.10 introduced `src/types/moment.ts` with `export type Moment = ReturnType<typeof moment>` (where `moment` is imported from `"obsidian"`). The intent was to satisfy the Obsidian community-plugin checker's restricted-imports rule for `"moment"` while preserving precise Moment instance types. In practice the derivation collapsed Moment instances to effectively `any` under the checker's type-aware lint pass, because resolving `typeof moment` through Obsidian's CommonJS re-export of moment's `export = moment; export as namespace moment` namespace did not yield a precise call-signature for `ReturnType` to extract. Calendar Plus's local lint (`@typescript-eslint/recommended`, non-type-aware) did not enable the `no-unsafe-*` rules that detect this, so the regression only surfaced when the Obsidian checker re-ran the plugin. Result: ~56 net new `unsafe-member-access` / `unsafe-call` warnings, one cluster per Moment method site (`.format`, `.clone`, `.add`, `.startOf`, `.weekday`, `.locale`, `.isoWeekday`, etc.).

What 1.7.11 changes
- Restored precise `Moment`, `Locale`, and `DurationUnit` types in `src/types/moment.ts`. The module now type-imports them directly from `"moment"` (with a single targeted `// eslint-disable-next-line no-restricted-imports` directive carrying a description of why it's there) and re-exports them. Consumers still `import type { Moment } from "src/types/moment"` everywhere else — no per-file churn.
- Runtime usage is unchanged: every source file still imports `moment` from `"obsidian"`. This release does **not** reintroduce `window.moment` runtime access. The 1.7.10 wins from the moment-runtime migration, the `Platform.isMacOS` swap, the loose-type tightening, the `void`-prefixed promises, and the arrow class properties on `CalendarView` are all preserved.

Notes for future contributors
- `src/types/moment.ts` is now the **single type-only seam** between Calendar Plus and the `"moment"` package. Any new Moment type the codebase needs should be added there and re-exported — keep the per-file `"moment"` import surface at exactly one.
- The eslint-disable directive uses the base ESLint `no-restricted-imports` rule rather than `@typescript-eslint/no-restricted-imports` because the pinned `@typescript-eslint/eslint-plugin@4.20.0` does not register the TS-specific variant; it was added in plugin v5+. If the typescript-eslint plugin is later upgraded, the disable target should switch to `@typescript-eslint/no-restricted-imports` for tighter scoping.

## 1.7.10

Focus: source-code warning cleanup pass against the Obsidian community-plugin review. No intended user-visible behavior change relative to 1.7.9.

Code quality (no behavior change)
- Migrated all `Moment` usage off the `"moment"` package. Calendar Plus now imports the runtime `moment` value from `"obsidian"` (which bundles moment) and derives the `Moment`, `Locale`, `WeekSpec`, and `DurationUnit` types locally in `src/types/moment.ts`. No source file imports types from `"moment"` directly anymore.
- Replaced the deprecated `navigator.appVersion` macOS sniff with Obsidian's documented `Platform.isMacOS` constant for Cmd/Ctrl-click detection.
- Tightened loose types in several hot paths: explicit `string | undefined` parameter types on the template-token regex callbacks (with a `DurationUnit` cast at the `.add()` call site), a typed `metadataReducer` accumulator with `?? []` / `?? {}` defaults, an explicit `string[]` on the tag-extraction and `partition` accumulators, a corrected `string | null` return on `getDateUIDFromFile`, and a `Partial<ISettings>` cast at the `loadData()` boundary in `loadOptions`. Two unnecessary type assertions removed (`split("/").pop() as string` → `?? format` fallback; the locale-override dropdown cast).
- Marked the remaining intentionally fire-and-forget promise calls with `void` (`workspace.revealLeaf`, `setViewState`, the nested `openOrCreateWeeklyNote` inside the command callback, the file-menu's `openLinkText`, and the confirmation-modal click handler — the latter rewritten as a void async IIFE so the event listener has the expected `void` return type).
- Converted the bound `CalendarView` event-handler and Svelte-prop methods to arrow class properties. The constructor's 20-line `this.X = this.X.bind(this)` block is gone; methods are `this`-bound at instance creation. The seven methods that aren't passed as callbacks (`getViewType`, `getDisplayText`, `getIcon`, `onOpen`, `onClose`, `updateActiveFile`, `revealActiveNote`) remain regular instance methods.

Known deferred warnings
- `localStorage.getItem("language")` in `src/ui/calendar-ui/localization.ts` is still flagged. Obsidian's `App.getLanguage()` is not in Calendar Plus's currently pinned Obsidian API (commit `23947b58…`, version 1.7.2); resolving this warning is paired with a future Obsidian d.ts pin bump.
- Several `unsafe-call` warnings on the Svelte `Calendar` component's `tick`, `$set`, and `$destroy` methods are framework-typing-generation noise rather than Calendar Plus correctness issues. Deferred pending a focused Svelte typing investigation.

## 1.7.9

Focus: clearing the last two Obsidian community-plugin review errors from the 1.7.8 resubmission. Settings-tab section headings renamed; no other behavior change.

User-visible
- Renamed the settings section headings to comply with Obsidian community-plugin review guidance, which discourages the word "Settings" and the generic label "General" inside a settings tab.
- "General Settings" is now "Calendar behavior".
- "Advanced Settings" is now "Locale".
- The "Periodic Notes" section heading and all per-period sub-headings ("Daily notes", "Weekly notes", "Monthly notes", "Quarterly notes", "Yearly notes") are unchanged.

## 1.7.8

Focus: polish pass on top of 1.7.7 — README presentation, a friendlier first-run experience, and a more recognizable sidebar icon. No code-quality or behavior regressions relative to 1.7.7.

User-visible
- Added a README screenshot showing the Calendar Plus sidebar so the GitHub page and Obsidian community-plugin listing have a visual at a glance.
- Rewrote the README intro to describe Calendar Plus as a substantial rewrite of Liam Cain's original Calendar and Periodic Notes plugins that merges the two into a single integrated calendar + periodic-notes workflow. The new intro also highlights the clickable month / quarter / year header labels and the "dots mean a note exists, and nothing else" design.
- Daily notes are now enabled by default. Fresh installs (and users whose saved `data.json` doesn't include a `daily` setting) get a calendar with daily-note clicking active out of the box, instead of having to find and flip the Enable toggle in settings. Existing users who have explicitly toggled Daily off keep their setting — the per-period deep-merge in `loadOptions` already preserves saved values over defaults.
- Switched the sidebar / ribbon icon from the older `calendar-with-checkmark` to Obsidian's built-in Lucide `calendar-plus` icon. The new icon matches the plugin name and is more recognizable at sidebar scale.

## 1.7.7

Focus: clearing Obsidian community-plugin review findings ahead of the directory submission. No user-visible behavior change; the calendar, settings, and periodic-note flows behave exactly as in 1.7.6.

Code quality
- Replaced every `@typescript-eslint/no-explicit-any` eslint-disable in the source tree with typed extension interfaces over Obsidian's internal APIs (`foldManager`, `keymap`, `fileManager.promptForFileDeletion`) and, for the mobile-detection paths in the vendored calendar UI, the documented public `Platform.isMobile`. The internal-API typings live in a new `src/types/obsidian-internal.ts`.
- Tightened the `ConfirmationModal` accept-handler signature: `onAccept` is now typed `() => Promise<void>` instead of `(...args: any[]) => Promise<void>`, removing the unlimited eslint-disable directive in `src/ui/modal.ts`.
- Switched the settings-tab section headings ("General Settings", "Periodic Notes", "Advanced Settings") from raw `<h3>` elements to `new Setting(...).setHeading()`, the documented Obsidian API. Section chrome now matches Obsidian's native settings styling.
- Switched the settings autocomplete dropdown's parent from `document.body` to `activeDocument.body` so the dropdown attaches correctly when settings are opened in a popout window. No behavior change in the main window.
- Marked intentional fire-and-forget promise calls with `void` (five `writeOptions` calls behind general-settings handlers, five `tryToCreate*Note` calls in the calendar view's open-or-create flows). No scheduling change; lint warnings silenced.

Release pipeline
- Removed the unsupported `calendar-plus-<tag>.zip` asset from the GitHub Actions release. Releases now ship only the three Obsidian-required files (`main.js`, `manifest.json`, `styles.css`).
- Added build-provenance attestations via `actions/attest-build-provenance@v2` for `main.js`, `manifest.json`, and `styles.css`. Workflow permissions extended to `id-token: write` and `attestations: write` to support the attestation step.
- Release notes are now extracted from the top section of `CHANGELOG.md` at release time (`awk` over the first `##` heading) and supplied to the release via `body_path: RELEASE_NOTES.md`. Tagged releases now produce populated release bodies automatically.

## 1.7.6

Focus: performance, correctness, and publication-readiness release on top of 1.7.5.

Calendar UI
- Dots for periodic notes now stay correct when files are renamed or moved between folders. Previously, renaming a daily note's basename (or moving a periodic note in or out of its configured folder) could leave a stale dot in the calendar until the plugin was reloaded or settings were changed. Calendar Plus now listens for vault rename events and updates indexes incrementally.
- Settings-tab folder and template autocomplete suggestions are now sorted alphabetically and capped at 200 results. In vaults with many folders or markdown files, the dropdown stays fast and predictable; typing one or two characters narrows results below the cap in practice.
- Calendar view placement is now preserved across plugin disable/re-enable. If you've moved the calendar to the left sidebar, into the main pane, or pinned it elsewhere, that placement now persists through plugin reloads. Previously, Calendar Plus snapped the view back to the right sidebar every time.

Internal / repo
- Periodic-note stores are now updated incrementally on file create/delete/rename events instead of doing a full folder rescan on each event. Negligible for typical vaults, but materially faster in large vaults (50k+ files, or daily folder set to the vault root). Settings changes still do a full reindex, which is the right behavior.
- Refactored the five per-period note stores into a single shared factory in `src/ui/stores.ts`, halving the code and centralizing the new incremental-update logic.
- Pinned the Obsidian API dependency in `package.json` to a specific commit SHA instead of the floating `#master` ref, and switched the GitHub Actions release workflow from `npm install` to `npm ci`. CI builds are now byte-deterministic for anyone cloning the repo.
- Pruned stale extraneous workspace entries from `package-lock.json` left over from before the 1.7.0 vendoring.
- Added a defensive null guard around `initLeaf`'s right-sidebar lookup so the calendar view can fail gracefully if the right sidebar is unavailable.
- `FUTURE_PLANS.md` is now down to two deferred-with-clear-trigger items; the long cleanup sequence that started with 1.7.0 vendoring is fully landed.

## 1.7.5

Focus: cleanup and polish release on top of 1.7.4. One small user-visible fix; the rest is internal hygiene.

Calendar UI
- Day cells without tags no longer receive an empty `data-tags=""` attribute. Themes targeting `[data-tags]` only match cells that actually carry tags now.

Internal / repo
- Removed dead Jest test scaffolding: `src/testUtils/`, `src/ui/__mocks__/`, and the `"jest"` config + `"test"` / `"test:watch"` scripts from `package.json`. None of it was referenced by source.
- Removed four unused Jest-related devDependencies: `@types/jest`, `jest`, `svelte-jester`, `ts-jest`. Slimmer install (Calendar Plus's `node_modules` shrank by ~450 packages) and a smaller `npm audit` surface.
- Removed the unused `patch-package` runtime dependency and the `postinstall` script that only ran it. The `patches/` directory has been gone since 1.7.0; the script has been a no-op since.

## 1.7.4

Focus: small bugfix release on top of 1.7.3.

Calendar UI
- Rapid duplicate clicks on the same empty periodic-note cell (daily, weekly, monthly, quarterly, or yearly) no longer race on note creation. Previously, a fast double-click with confirm-before-create off could dispatch two concurrent `vault.create` calls; the second would lose the race and surface a stray "Unable to create new file" notice. Calendar Plus now tracks in-flight creates per (periodicity, date) and silently short-circuits duplicates while the first is still resolving. Clicks on different days, different periodicities, or after the first create completes continue to work normally.

## 1.7.3

Focus: maintenance and Obsidian-API-compatibility release on top of 1.7.2. No user-visible UI changes.

Internal / repo
- Modernized deprecated Obsidian workspace API usage throughout `src/view.ts` and the monthly/quarterly/yearly note-creation wrappers. The five periodic-note handlers and wrappers now consistently use `workspace.getLeaf("split", "vertical")` and `workspace.getLeaf(false)` instead of `splitActiveLeaf()` and `getUnpinnedLeaf()`, and the post-create focus call uses the modern `workspace.setActiveLeaf(leaf, { focus: true })` options form. Cmd/Meta-click on a month / year / quarter label now opens the new split to the right of the active pane, matching daily/weekly behavior (previously could open below).
- Replaced `app.workspace.activeLeaf` + `FileView` `instanceof` checks in `updateActiveFile` and `revealActiveNote` with `workspace.getActiveFile()`. Eliminates two latent null-deref paths that could throw during transient workspace states with no active leaf.
- Removed the now-unused `FileView` import from `src/view.ts`.
- Updated `FUTURE_PLANS.md` / `CLAUDE.md`: the deprecated-workspace-APIs item is complete and removed; a smaller follow-up to migrate the `"layout-ready"` event in `src/main.ts` to `workspace.onLayoutReady(callback)` has been tracked in its place.

## 1.7.2

Focus: visual polish and CSS cleanup release on top of 1.7.1.

Calendar UI
- Centered the TODAY button vertically between the previous/next navigation arrows.
- Added the purple active-background treatment to active weekly notes — the active week-number cell now matches the active-daily-note styling instead of looking the same as a non-active cell.
- Removed the vertical divider on the left of the week-number column when it's shown on the right side. The left-side placement still shows its right-edge divider.

Internal / repo
- Moved component-owned CSS rules out of `styles.css` and into the vendored calendar components' `<style>` blocks (week-num font size and dot-container reservation into `WeekNum.svelte`; container `user-select: none` and the weekend column shading default into `Calendar.svelte`; TODAY and arrow hover dim into `Nav.svelte` and `Arrow.svelte`). `styles.css` now contains only wrapper-state-dependent rules (gated on `.daily-enabled`/`.monthly-enabled`/etc.) and the settings autocomplete dropdown rule.
- No user-visible change from the CSS migration — visual output is identical to 1.7.1.

## 1.7.1

Focus: bug-fix and polish release on top of 1.7.0.

Calendar UI
- Fixed the current-month rollover check so the calendar advances at midnight on the last day of the month. The heartbeat now compares `displayedMonth` and `today` by month instead of by day.
- Restored the purple press feedback on day cells when Daily notes are enabled. Click-and-hold on a day now shows the same purple background + light text the original Calendar plugin showed; the feedback releases naturally on mouseup.
- Fixed disabled-Daily-note day-cell interactions so hovering or pressing a day no longer removes the purple background of an active or today cell, and pressing a today cell no longer flickers its purple text to the default text color.
- All seven day-of-week columns now render at identical widths, so day-cell hover, press, and active backgrounds are the same size across columns. The week-number column remains slightly narrower.

Internal / repo
- Modernized the GitHub release workflow: bumped checkout/setup-node to v4, switched to Node 20, replaced the archived release-asset actions with `softprops/action-gh-release@v2`, and dropped a redundant `npx patch-package` step.
- Removed stale inherited README screenshots (`images/`) and the unused `TESTING.md` file. Fixed `.gitignore` so `.DS_Store` is now actually ignored.
- Pruned completed cleanup items from `FUTURE_PLANS.md` and the `CLAUDE.md` known-issues list (README refresh, CI consolidation, funding metadata cleanup — all done in earlier work).

## 1.7.0

Focus: internal cleanup and refactor release after the 1.6.0 feature baseline. No user-visible behavior changes — Calendar Plus should look and act exactly as it did in 1.6.0.

- Vendored the calendar UI source into Calendar Plus under `src/ui/calendar-ui/`. Calendar Plus now owns its calendar components, types, and helpers directly.
- Removed the `obsidian-calendar-ui` dependency.
- Removed the `patch-package` patch that was previously maintained against `obsidian-calendar-ui`.
- Replaced the Popper-based folder/template autocomplete in settings with a local no-Popper implementation that positions the dropdown via `getBoundingClientRect()` + inline `position: fixed`.
- Removed the `@popperjs/core` dependency.
- Reduced bundle and dependency complexity overall: fewer transitive dependencies, no patched libraries, smaller install footprint.

## 1.6.0

Focus: major Calendar Plus feature baseline — Periodic Notes-style functionality integrated directly into the calendar.

Periodic notes
- Integrated Periodic Notes-style functionality directly into Calendar Plus. Calendar Plus now owns its own settings for daily, weekly, monthly, quarterly, and yearly notes, independent of Obsidian's core Daily Notes plugin and the Periodic Notes plugin.
- Added support for creating and opening monthly, quarterly, and yearly notes from the calendar UI.
- Added folder and template path autocomplete in the settings tab for each periodic-note section.
- Loading is safer: per-period settings are deep-merged over defaults so a partial `data.json` cannot wipe `format` / `folder` / `template` and produce broken filenames.

Calendar UI
- Added clickable month, year, and quarter labels in the calendar header — each opens or creates the corresponding periodic note.
- Added a quarter row (Q1–Q4) under the month/year header, visible when quarterly notes are enabled.
- Added a Calendar Plus ribbon icon that reveals the existing calendar leaf or creates one.
- Added subtle weekend column shading.
- Improved hover and disabled-state affordances: month / year / quarter / day labels only look interactive when their note type is enabled. Suppressed a transient purple flash on day cells during click-drag.
- Improved weekly note column: dot-container reserved height to prevent week-number jitter, and week-number font size matched to day-number font size.

Dots
- Dots now indicate exactly one thing: a periodic note exists for that day or week.
- Removed word-count-per-dot and task-dot rendering.

Settings
- Toggling Enable on a periodic-note section now re-renders only that section's wrapper instead of rebuilding the whole settings tab — no scroll jump.
- Settings tab can be opened before the calendar view has mounted (locale week-spec is initialized eagerly).

Lifecycle and stability
- Fixed stale `CalendarView` references in commands by looking up the live view fresh per invocation.
- Fixed a `settings.subscribe` leak in the calendar view that caused a `tick is not a function` crash on settings change.
- `open-weekly-note` mounts the view if needed; `reveal-active-note` no-ops cleanly when the view is absent.

Coexistence
- Calendar Plus runs alongside the original Calendar plugin without collision: separate plugin id (`calendar-plus`), separate view type (`calendar-plus-view`), and separate event namespace (`calendar-plus:open`).
