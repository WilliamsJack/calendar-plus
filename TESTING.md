# Calendar Plus — Manual Sandbox Testing

Use a dedicated test vault so production notes are never affected. Each section below lists preconditions, steps, and expected results. Check each box as you verify it.

---

## 1. Installation / Identity

**Precondition:** Plugin files (`main.js`, `manifest.json`, `styles.css`) are copied to `<vault>/.obsidian/plugins/calendar-plus/`.

- [ ] Plugin appears in Settings → Community Plugins as **Calendar Plus** (not "Calendar")
- [ ] Plugin ID in `manifest.json` is `calendar-plus`
- [ ] Enabling the plugin does not produce console errors
- [ ] The calendar icon appears in the left ribbon
- [ ] Clicking the ribbon icon opens the Calendar Plus view in the sidebar
- [ ] View header reads **Calendar Plus**
- [ ] If the original "calendar" plugin is also installed, both appear separately and enabling one does not affect the other

---

## 2. Settings

**Precondition:** Plugin is enabled. Open Settings → Calendar Plus.

### General Settings

- [ ] **Start week on** dropdown is present; changing it immediately reorders the calendar columns
- [ ] Setting `locale` uses the system locale default
- [ ] Setting a specific weekday (e.g., Monday) is persisted after closing and reopening Settings
- [ ] **Ctrl + Click Behaviour** dropdown shows "Open in new tab" and "Open in new split"
- [ ] **Confirm before creating new note** toggle is present and defaults to on
- [ ] **Change week number side** toggle moves week numbers left ↔ right on the calendar

### Periodic Notes — Default State

- [ ] Daily, Weekly, Monthly, Quarterly, and Yearly sections each appear
- [ ] Each section shows only an **Enable** toggle (all off by default)
- [ ] No extra fields are visible while a note type is disabled

### Periodic Notes — Enabling Reveals Fields

For each note type (repeat for all five):

- [ ] Toggling **Enable** on reveals: Date format, Folder, Template file fields
- [ ] Toggling **Enable** off hides those fields immediately
- [ ] Date format field shows the correct default placeholder:
  - Daily: `YYYY-MM-DD`
  - Weekly: `gggg-[W]ww`
  - Monthly: `YYYY-MM`
  - Quarterly: `YYYY-[Q]Q`
  - Yearly: `YYYY`
- [ ] Folder field is blank by default; accepts paths like `notes/daily`
- [ ] Template file field is blank by default; accepts paths like `templates/daily`
- [ ] All field values survive a plugin reload (disable → enable)

### Advanced Settings

- [ ] **Override locale** dropdown is present
- [ ] Selecting a locale changes calendar day/month labels accordingly

---

## 3. Daily Notes

**Precondition:** Enable Daily notes in Settings. Leave format as default (`YYYY-MM-DD`). Optionally set a folder.

- [ ] Clicking a calendar day creates a daily note with the correct filename (e.g., `2026-05-03.md`)
- [ ] Note is created in the configured folder (or vault root if blank)
- [ ] File opens in the active leaf after creation
- [ ] Clicking the same day again opens the existing note (no duplicate created)
- [ ] **Ctrl + Click** opens in a new tab (when "Open in new tab" is selected in Settings)
- [ ] **Ctrl + Click** opens in a new split (when "Open in new split" is selected)
- [ ] **Confirm before create** modal appears when the toggle is on; cancelling does not create the file
- [ ] Custom date format (e.g., `DD-MM-YYYY`) produces correctly named files
- [ ] Custom folder is created automatically if it does not exist
- [ ] Template content is inserted when a template file path is set and the file exists
- [ ] Disabling Daily notes in Settings removes click-to-create behavior for days

---

## 4. Weekly Notes

**Precondition:** Enable Weekly notes in Settings. Leave format as default (`gggg-[W]ww`).

- [ ] Week numbers are visible on the calendar (left side by default)
- [ ] Clicking a week number creates a weekly note with the correct filename (e.g., `2026-W18.md`)
- [ ] Note is created in the configured folder
- [ ] File opens after creation
- [ ] Clicking the same week number again opens the existing note
- [ ] **Change week number side** toggle moves numbers to the right; clicking still creates/opens correctly
- [ ] Weekly note filename reflects the ISO week containing the clicked date (verify edge case: week spanning two months)
- [ ] Custom format (e.g., `YYYY-[Week]-w`) produces correctly named files
- [ ] Template content is inserted when configured
- [ ] Disabling Weekly notes hides week numbers from the calendar

---

## 5. Monthly Notes

**Precondition:** Enable Monthly notes in Settings. Leave format as default (`YYYY-MM`).

- [ ] Clicking the month/year header (or the month label, depending on UI) creates a monthly note
- [ ] Filename matches the format (e.g., `2026-05.md`)
- [ ] Note is created in the configured folder
- [ ] File opens after creation
- [ ] Clicking again opens the existing note
- [ ] Custom format (e.g., `YYYY-MMMM`) produces correctly named files
- [ ] Template content is inserted when configured
- [ ] Disabling Monthly notes removes click-to-create behavior

---

## 6. Quarterly Notes

**Precondition:** Enable Quarterly notes in Settings. Leave format as default (`YYYY-[Q]Q`).

- [ ] Clicking the quarter label creates a quarterly note (e.g., `2026-Q2.md`)
- [ ] Note is created in the configured folder
- [ ] File opens after creation
- [ ] Clicking again opens the existing note
- [ ] Custom format produces correctly named files
- [ ] Template content is inserted when configured
- [ ] Disabling Quarterly notes removes click-to-create behavior

---

## 7. Yearly Notes

**Precondition:** Enable Yearly notes in Settings. Leave format as default (`YYYY`).

- [ ] Clicking the year label creates a yearly note (e.g., `2026.md`)
- [ ] Note is created in the configured folder
- [ ] File opens after creation
- [ ] Clicking again opens the existing note
- [ ] Custom format (e.g., `YYYY[-annual]`) produces correctly named files
- [ ] Template content is inserted when configured
- [ ] Disabling Yearly notes removes click-to-create behavior

---

## 8. File Events / Refresh

**Precondition:** At least Daily notes enabled. Open the calendar view.

- [ ] Creating a daily note via the calendar adds a dot to that day immediately (no reload required)
- [ ] Deleting a daily note file from the vault removes its dot immediately
- [ ] Renaming a daily note file updates the calendar dot (old day loses dot, new day gains one if valid)
- [ ] Creating a note manually in the file explorer (with a valid daily-format filename) shows a dot without reloading
- [ ] Moving a note file to a different folder does not leave a stale dot if the folder no longer matches settings
- [ ] Navigating to a different month and back correctly shows dots for existing notes

---

## 9. Metadata / Source Checks

**Precondition:** Daily notes enabled. Several daily notes exist across the current month.

### Dots (Note Existence)

- [ ] Days with an existing note show exactly **one filled dot**
- [ ] Days without a note show **no dot**
- [ ] No word-count dots (multiple dots for long notes) appear
- [ ] No task dots (hollow dot for incomplete tasks) appear

### Streak Classes

- [ ] Today's date is highlighted distinctly
- [ ] Consecutive days with notes receive a visual streak indicator (connected highlight or class)
- [ ] A gap day breaks the streak visually

### Custom Tags (if tags source is active)

- [ ] Notes tagged with a configured custom tag show a colored dot
- [ ] Removing the tag from the note removes the dot on the next calendar render

---

## 10. Bugs Found

| # | Date | Area | Steps to Reproduce | Expected | Actual | Status |
|---|------|------|--------------------|----------|--------|--------|
| 1 |      |      |                    |          |        | Open   |
