# Changelog

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
