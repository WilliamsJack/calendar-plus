# Future Plans

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
