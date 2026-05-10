# Future Plans

Non-blocking polish and cleanup deferred past the 1.6.0 / 1.7.0 baseline on `main`. None are required for the current stable baseline.

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

## Optional: settings UI modernization

Consider migrating the settings tab to Svelte in a future branch. Potential benefits:
- Cleaner conditional UI via `{#if}` blocks instead of imperative `.empty()` + rebuild.
- Easier slide / fade animations on enable-toggle expansion.
- Less imperative DOM rebuilding overall.

Not needed for the current stable baseline; the per-section re-render approach already works well.

## Optional: active-file correctness for monthly / quarterly / yearly

`getDateUIDFromFile` (`src/ui/utils.ts`) currently only checks daily and weekly periodicities. If a future UI change adds active-state highlighting for month / quarter / year cells, extend the function to detect those file types as well. No visible regression today because the underlying calendar UI doesn't render an active state for those cells.

## Optional: midnight rollover fix

`Calendar.svelte`'s heartbeat checks `displayedMonth.isSame(today, "day")` to decide whether the visible month should advance at midnight. The intent is "is the user viewing the current month", which should be `isSame(today, "month")`. Pre-existing upstream behavior — low priority but worth tracking if anyone hits the cosmetic glitch around midnight on the last day of a month.
