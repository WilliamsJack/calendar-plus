# Changelog

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
