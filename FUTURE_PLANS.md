# Future Plans

Non-blocking items deferred from the 1.6.0 final review. None are required for the current stable baseline.

## Move component-internal CSS overrides into vendored components

The calendar UI is now vendored under `src/ui/calendar-ui/` and `obsidian-calendar-ui` + its patch have been removed. `styles.css` still carries overrides scoped via `.calendar-plus-wrapper #calendar-container` selectors. A future cleanup pass should move component-internal rules into the vendored components' `<style>` blocks so the override prefix is no longer needed for those rules.

Candidates to move (single-component concerns):
- `.week-num { font-size: 0.8em }` → `WeekNum.svelte`.
- `.week-num .dot-container { ... min-height: 6px }` → `WeekNum.svelte` (parity with the dot-container already styled in `Day.svelte`).
- `.reset-button:hover { opacity: 0.7 }` → `Nav.svelte`.
- `.arrow:hover { opacity: 0.7 }` → `Arrow.svelte`.
- `--color-background-weekend: var(--color-base-25)` default → `Calendar.svelte` `.container`.
- `#calendar-container { user-select: none }` → `Calendar.svelte` `.container`.
- `.day:active:not(.active) { background-color: var(--color-background-day) }` → `Day.svelte` (suppresses the upstream `.day:active` selector).

Must stay in `styles.css` (depend on wrapper-state classes set by the outer `Calendar.svelte`):
- Disabled-state cursor / hover suppression for day cells (`:not(.daily-enabled) .day { cursor: default; ... }`).
- Cursor + hover gating for `.month` / `.year` / `.quarter` based on `.monthly-enabled` / `.yearly-enabled` / `.quarterly-enabled`.

Goal: visually identical output; render-DOM diff should be empty after the refactor.

## README refresh

`README.md` still carries inherited copy from the original Calendar plugin. A future pass should:
- Remove word-count-per-dot and hollow task-dot descriptions (those features were removed).
- Replace old setting names (e.g. "Show Week Numbers") with the current Periodic Notes → enable flow.
- Update old plugin identity references (`obsidian-calendar-plugin`, `liamcain/...`) to Calendar Plus where they describe Calendar Plus, while keeping appropriate attribution.
- Refresh installation/usage sections so they describe the current behavior.

## CI / release workflow cleanup

Review `.github/workflows/`:
- There are two near-duplicate release workflows (`main.yml` and `publish.yml`) that both fire on tag push.
- Consolidate to a single workflow.
- Ensure the release artifact and `PLUGIN_NAME` are `calendar-plus` (current values are stale: `obsidian-calendar-plugin` and `calendar`).

## Funding metadata cleanup

`.github/FUNDING.yml` still points at the upstream author (`liamcain` GitHub Sponsors / PayPal / Buy Me a Coffee). For this fork, remove or update those links while preserving appropriate attribution to the upstream project elsewhere (e.g. README).

## Optional: settings UI modernization

Consider migrating the settings tab to Svelte in a future branch. Potential benefits:
- Cleaner conditional UI via `{#if}` blocks instead of imperative `.empty()` + rebuild.
- Easier slide / fade animations on enable-toggle expansion.
- Less imperative DOM rebuilding overall.

Not needed for the current stable baseline; the per-section re-render approach already works well.

## Optional: autocomplete lifecycle cleanup

Review `src/ui/suggest.ts`. The final review noted that `open()` may create a new Popper instance on every input event without destroying the previous one. Either early-return when `this.popper` already exists, or `this.popper?.destroy()` before reassigning. Inherited from the periodic-notes upstream — same bug exists there.

## Optional: replace Popper-based autocomplete with no-Popper port from Daily Time Tracker

Calendar Plus currently uses `@popperjs/core` for the folder/template autocomplete in settings (`src/ui/suggest.ts`, `src/ui/file-suggest.ts`). That implementation was copied/adapted from Periodic Notes.

The Daily Time Tracker plugin has a simpler autocomplete implementation that works well without `@popperjs/core`. A future cleanup pass should audit that approach and potentially port it into Calendar Plus.

Goals:
- Remove the `@popperjs/core` dependency from `package.json` / `package-lock.json`.
- Reduce dependency weight and avoid Popper lifecycle complexity (positioning, instance reuse, destroy).
- Preserve folder and template path suggestions in the settings tab.
- Would supersede the "autocomplete lifecycle cleanup" item above — no Popper, no popper leak to fix.

## Optional: active-file correctness for monthly / quarterly / yearly

`getDateUIDFromFile` (`src/ui/utils.ts`) currently only checks daily and weekly periodicities. If a future UI change adds active-state highlighting for month / quarter / year cells, extend the function to detect those file types as well. No visible regression today because the underlying calendar UI doesn't render an active state for those cells.

## Optional: midnight rollover fix

`Calendar.svelte`'s heartbeat checks `displayedMonth.isSame(today, "day")` to decide whether the visible month should advance at midnight. The intent is "is the user viewing the current month", which should be `isSame(today, "month")`. Pre-existing upstream behavior — low priority but worth tracking if anyone hits the cosmetic glitch around midnight on the last day of a month.
