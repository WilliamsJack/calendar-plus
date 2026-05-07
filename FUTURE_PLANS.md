# Future Plans

Non-blocking items deferred from the 1.6.0 final review. None are required for the current stable baseline.

## Vendor calendar UI

Calendar Plus currently uses the obsidian-calendar-ui package for the core calendar UI. A future cleanup pass should vendor that UI into Calendar Plus directly so the plugin owns the calendar source, styles, and interaction behavior without relying on dependency patches or CSS overrides.

Goals:
- Remove the obsidian-calendar-ui dependency if possible.
- Remove or reduce the patch-package patch for obsidian-calendar-ui.
- Replace Calendar Plus CSS overrides with direct source-level styles where appropriate.
- Preserve current Calendar Plus behavior exactly during the refactor.

Notes:
- This should be done in a separate future branch.
- Do not combine it with bug fixes or user-facing feature work.

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

## Optional: active-file correctness for monthly / quarterly / yearly

`getDateUIDFromFile` (`src/ui/utils.ts`) currently only checks daily and weekly periodicities. If a future UI change adds active-state highlighting for month / quarter / year cells, extend the function to detect those file types as well. No visible regression today because the underlying calendar UI doesn't render an active state for those cells.

## Optional: midnight rollover fix

`Calendar.svelte`'s heartbeat checks `displayedMonth.isSame(today, "day")` to decide whether the visible month should advance at midnight. The intent is "is the user viewing the current month", which should be `isSame(today, "month")`. Pre-existing upstream behavior — low priority but worth tracking if anyone hits the cosmetic glitch around midnight on the last day of a month.
