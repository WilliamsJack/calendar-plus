import type { Moment } from "moment";
import {
  getDateFromFile,
  getYearlyNote,
  getYearlyNoteSettings,
  getQuarterlyNote,
  getQuarterlyNoteSettings,
} from "obsidian-daily-notes-interface";
import {
  getDateFromFile as helperGetDateFromFile,
  getPeriodicNote as helperGetPeriodicNote,
} from "src/io/periodicNoteHelpers";
import { FileView, TFile, ItemView, WorkspaceLeaf } from "obsidian";
import { get } from "svelte/store";

import { TRIGGER_ON_OPEN, VIEW_TYPE_CALENDAR } from "src/constants";
import { tryToCreateDailyNote } from "src/io/dailyNotes";
import { tryToCreateWeeklyNote } from "src/io/weeklyNotes";
import { tryToCreateMonthlyNote } from "src/io/monthlyNotes";
import { tryToCreateYearlyNote } from "src/io/yearlyNotes";
import { tryToCreateQuarterlyNote } from "src/io/quarterlyNotes";
import type { ISettings } from "src/settings";

import Calendar from "./ui/Calendar.svelte";
import { showFileMenu } from "./ui/fileMenu";
import {
  activeFile,
  dailyNotes,
  weeklyNotes,
  monthlyNotes,
  quarterlyNotes, // Added quarterlyNotes
  yearlyNotes,
  settings,
} from "./ui/stores";
import {
  customTagsSource,
  streakSource,
  tasksSource,
  wordCountSource,
} from "./ui/sources";

export default class CalendarView extends ItemView {
  private calendar: Calendar;
  private settings: ISettings;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);

    this.openOrCreateDailyNote = this.openOrCreateDailyNote.bind(this);
    this.openOrCreateWeeklyNote = this.openOrCreateWeeklyNote.bind(this);
    this.openOrCreateMonthlyNote = this.openOrCreateMonthlyNote.bind(this);
    this.openOrCreateYearlyNote = this.openOrCreateYearlyNote.bind(this);
    this.openOrCreateQuarterlyNote = this.openOrCreateQuarterlyNote.bind(this); // Added binding

    this.onNoteSettingsUpdate = this.onNoteSettingsUpdate.bind(this);
    this.onFileCreated = this.onFileCreated.bind(this);
    this.onFileDeleted = this.onFileDeleted.bind(this);
    this.onFileModified = this.onFileModified.bind(this);
    this.onFileOpen = this.onFileOpen.bind(this);

    this.onHoverDay = this.onHoverDay.bind(this);
    this.onHoverWeek = this.onHoverWeek.bind(this);
    this.onHoverMonth = this.onHoverMonth.bind(this);
    this.onHoverYear = this.onHoverYear.bind(this);
    this.onHoverQuarter = this.onHoverQuarter.bind(this); // Added binding

    this.onContextMenuDay = this.onContextMenuDay.bind(this);
    this.onContextMenuWeek = this.onContextMenuWeek.bind(this);
    this.onContextMenuMonth = this.onContextMenuMonth.bind(this);
    this.onContextMenuYear = this.onContextMenuYear.bind(this);
    this.onContextMenuQuarter = this.onContextMenuQuarter.bind(this); // Added binding

    this.registerEvent(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>this.app.workspace).on(
        "periodic-notes:settings-updated",
        this.onNoteSettingsUpdate
      )
    );
    this.registerEvent(this.app.vault.on("create", this.onFileCreated));
    this.registerEvent(this.app.vault.on("delete", this.onFileDeleted));
    this.registerEvent(this.app.vault.on("modify", this.onFileModified));
    this.registerEvent(this.app.workspace.on("file-open", this.onFileOpen));

    this.settings = null;
    settings.subscribe((val) => {
      this.settings = val;

      // Refresh the calendar if settings change
      if (this.calendar) {
        this.calendar.tick();
      }
    });
  }

  getViewType(): string {
    return VIEW_TYPE_CALENDAR;
  }

  getDisplayText(): string {
    return "Calendar";
  }

  getIcon(): string {
    return "calendar-with-checkmark";
  }

  onClose(): Promise<void> {
    if (this.calendar) {
      this.calendar.$destroy();
    }
    return Promise.resolve();
  }

  async onOpen(): Promise<void> {
    // Integration point: external plugins can listen for `calendar:open`
    // to feed in additional sources.
    const sources = [
      customTagsSource,
      streakSource,
      wordCountSource,
      tasksSource,
    ];
    this.app.workspace.trigger(TRIGGER_ON_OPEN, sources);

    this.calendar = new Calendar({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (this as any).contentEl,
      props: {
        onClickDay: this.openOrCreateDailyNote,
        onClickWeek: this.openOrCreateWeeklyNote,
        onClickMonth: this.openOrCreateMonthlyNote,
        onClickYear: this.openOrCreateYearlyNote,
        onClickQuarter: this.openOrCreateQuarterlyNote,
        onHoverDay: this.onHoverDay,
        onHoverWeek: this.onHoverWeek,
        onHoverMonth: this.onHoverMonth,
        onHoverYear: this.onHoverYear,
        onHoverQuarter: this.onHoverQuarter,
        onContextMenuDay: this.onContextMenuDay,
        onContextMenuWeek: this.onContextMenuWeek,
        onContextMenuMonth: this.onContextMenuMonth,
        onContextMenuYear: this.onContextMenuYear,
        onContextMenuQuarter: this.onContextMenuQuarter,
        sources,
      },
    });
  }

  onHoverDay(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed || !this.settings.daily.enabled) {
      return;
    }
    const format = this.settings.daily.format;
    const note = helperGetPeriodicNote(date, "daily", get(dailyNotes) ?? {});
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  onHoverWeek(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed || !this.settings.weekly.enabled) {
      return;
    }
    const format = this.settings.weekly.format;
    const note = helperGetPeriodicNote(date, "weekly", get(weeklyNotes) ?? {});
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  onHoverMonth(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed || !this.settings.monthly.enabled) {
      return;
    }
    const format = this.settings.monthly.format;
    const note = helperGetPeriodicNote(date, "monthly", get(monthlyNotes) ?? {});
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  onHoverYear(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    const note = getYearlyNote(date, get(yearlyNotes));
    const { format } = getYearlyNoteSettings();
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  onHoverQuarter(
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean
  ): void {
    if (!isMetaPressed) {
      return;
    }
    const { format } = getQuarterlyNoteSettings();
    const note = getQuarterlyNote(date, get(quarterlyNotes));
    this.app.workspace.trigger(
      "link-hover",
      this,
      targetEl,
      date.format(format),
      note?.path
    );
  }

  private onContextMenuDay(date: Moment, event: MouseEvent): void {
    if (!this.settings.daily.enabled) return;
    const note = helperGetPeriodicNote(date, "daily", get(dailyNotes) ?? {});
    if (!note) {
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onContextMenuWeek(date: Moment, event: MouseEvent): void {
    if (!this.settings.weekly.enabled) return;
    const note = helperGetPeriodicNote(date, "weekly", get(weeklyNotes) ?? {});
    if (!note) {
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onContextMenuMonth(date: Moment, event: MouseEvent): void {
    if (!this.settings.monthly.enabled) return;
    const note = helperGetPeriodicNote(date, "monthly", get(monthlyNotes) ?? {});
    if (!note) {
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onContextMenuYear(date: Moment, event: MouseEvent): void {
    const note = getYearlyNote(date, get(yearlyNotes));
    if (!note) {
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onContextMenuQuarter(date: Moment, event: MouseEvent): void {
    const note = getQuarterlyNote(date, get(quarterlyNotes));
    if (!note) {
      return;
    }
    showFileMenu(this.app, note, {
      x: event.pageX,
      y: event.pageY,
    });
  }

  private onNoteSettingsUpdate(): void {
    dailyNotes.reindex();
    weeklyNotes.reindex();
    monthlyNotes.reindex();
    quarterlyNotes.reindex(); // Added line
    yearlyNotes.reindex();
    this.updateActiveFile();
  }

  private async onFileDeleted(file: TFile): Promise<void> {
    if (this.settings.daily.enabled && helperGetDateFromFile(file, "daily", this.settings.daily.format)) {
      dailyNotes.reindex();
      this.updateActiveFile();
    }
    if (this.settings.weekly.enabled && helperGetDateFromFile(file, "weekly", this.settings.weekly.format)) {
      weeklyNotes.reindex();
      this.updateActiveFile();
    }
    if (this.settings.monthly.enabled && helperGetDateFromFile(file, "monthly", this.settings.monthly.format)) {
      monthlyNotes.reindex();
      this.updateActiveFile();
    }
    if (getDateFromFile(file, "quarter")) {
      // Added block
      quarterlyNotes.reindex();
      this.updateActiveFile();
    }
    if (getDateFromFile(file, "year")) {
      yearlyNotes.reindex();
      this.updateActiveFile();
    }
  }

  private async onFileModified(file: TFile): Promise<void> {
    const date =
      (this.settings.daily.enabled ? helperGetDateFromFile(file, "daily", this.settings.daily.format) : null) ||
      (this.settings.weekly.enabled ? helperGetDateFromFile(file, "weekly", this.settings.weekly.format) : null) ||
      (this.settings.monthly.enabled ? helperGetDateFromFile(file, "monthly", this.settings.monthly.format) : null) ||
      getDateFromFile(file, "quarter") || // Added line
      getDateFromFile(file, "year");
    if (date && this.calendar) {
      this.calendar.tick();
    }
  }

  private onFileCreated(file: TFile): void {
    if (this.app.workspace.layoutReady && this.calendar) {
      if (this.settings.daily.enabled && helperGetDateFromFile(file, "daily", this.settings.daily.format)) {
        dailyNotes.reindex();
        this.calendar.tick();
      }
      if (this.settings.weekly.enabled && helperGetDateFromFile(file, "weekly", this.settings.weekly.format)) {
        weeklyNotes.reindex();
        this.calendar.tick();
      }
      if (this.settings.monthly.enabled && helperGetDateFromFile(file, "monthly", this.settings.monthly.format)) {
        monthlyNotes.reindex();
        this.calendar.tick();
      }
      if (getDateFromFile(file, "quarter")) {
        // Added block
        quarterlyNotes.reindex();
        this.calendar.tick();
      }
      if (getDateFromFile(file, "year")) {
        yearlyNotes.reindex();
        this.calendar.tick();
      }
    }
  }

  public onFileOpen(_file: TFile): void {
    if (this.app.workspace.layoutReady) {
      this.updateActiveFile();
    }
  }

  private updateActiveFile(): void {
    const { view } = this.app.workspace.activeLeaf;

    let file = null;
    if (view instanceof FileView) {
      file = view.file;
    }
    activeFile.setFile(file);

    if (this.calendar) {
      this.calendar.tick();
    }
  }

  public revealActiveNote(): void {
    const { moment } = window;
    const { activeLeaf } = this.app.workspace;

    if (activeLeaf.view instanceof FileView) {
      let date = this.settings.daily.enabled
        ? helperGetDateFromFile(activeLeaf.view.file, "daily", this.settings.daily.format)
        : null;
      if (date) {
        this.calendar.$set({ displayedMonth: date });
        return;
      }

      date = this.settings.weekly.enabled
        ? helperGetDateFromFile(activeLeaf.view.file, "weekly", this.settings.weekly.format)
        : null;
      if (date) {
        this.calendar.$set({ displayedMonth: date });
        return;
      }

      date = this.settings.monthly.enabled
        ? helperGetDateFromFile(activeLeaf.view.file, "monthly", this.settings.monthly.format)
        : null;
      if (date) {
        this.calendar.$set({ displayedMonth: date });
        return;
      }

      const { format: quarterlyFormat } = getQuarterlyNoteSettings(); // Added block
      date = moment(activeLeaf.view.file.basename, quarterlyFormat, true);
      if (date.isValid()) {
        this.calendar.$set({ displayedMonth: date });
        return;
      }

      const { format: yearlyFormat } = getYearlyNoteSettings();
      date = moment(activeLeaf.view.file.basename, yearlyFormat, true);
      if (date.isValid()) {
        this.calendar.$set({ displayedMonth: date });
        return;
      }
    }
  }

  async openOrCreateWeeklyNote(
    date: Moment,
    ctrlPressed: boolean
  ): Promise<void> {
    if (!this.settings.weekly.enabled) return;
    const { workspace } = this.app;

    const existingFile = helperGetPeriodicNote(date, "weekly", get(weeklyNotes) ?? {});

    if (!existingFile) {
      tryToCreateWeeklyNote(date.clone().startOf("week"), ctrlPressed, this.settings, (file) => {
        activeFile.setFile(file);
      });
      return;
    }

    let leaf: WorkspaceLeaf;
    if (ctrlPressed) {
      if (this.settings.ctrlClickOpensInNewTab) {
        leaf = workspace.getLeaf("tab");
      } else {
        leaf = workspace.getLeaf("split", "vertical");
      }
    } else {
      leaf = workspace.getLeaf(false);
    }
    await leaf.openFile(existingFile);
  }

  async openOrCreateDailyNote(
    date: Moment,
    ctrlPressed: boolean
  ): Promise<void> {
    if (!this.settings.daily.enabled) return;
    const { workspace } = this.app;
    const existingFile = helperGetPeriodicNote(date, "daily", get(dailyNotes) ?? {});
    if (!existingFile) {
      tryToCreateDailyNote(
        date,
        ctrlPressed,
        this.settings,
        (dailyNote: TFile) => {
          activeFile.setFile(dailyNote);
        }
      );
      return;
    }

    let leaf: WorkspaceLeaf;
    if (ctrlPressed) {
      if (this.settings.ctrlClickOpensInNewTab) {
        leaf = workspace.getLeaf("tab");
      } else {
        leaf = workspace.getLeaf("split", "vertical");
      }
    } else {
      leaf = workspace.getLeaf(false);
    }
    await leaf.openFile(existingFile);
  }

  async openOrCreateMonthlyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    if (!this.settings.monthly.enabled) return;
    const { workspace } = this.app;

    const startOfMonth = date.clone().startOf("month");

    const existingFile = helperGetPeriodicNote(date, "monthly", get(monthlyNotes) ?? {});
    if (!existingFile) {
      tryToCreateMonthlyNote(
        startOfMonth,
        inNewSplit,
        this.settings,
        (file) => {
          activeFile.setFile(file);
        }
      );
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.setFile(existingFile);
    workspace.setActiveLeaf(leaf, true, true);
  }

  async openOrCreateQuarterlyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    const startOfQuarter = date.clone().startOf("quarter");

    const existingFile = getQuarterlyNote(date, get(quarterlyNotes));

    if (!existingFile) {
      tryToCreateQuarterlyNote(
        startOfQuarter,
        inNewSplit,
        this.settings,
        (file) => {
          activeFile.setFile(file);
        }
      );
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.setFile(existingFile);
    workspace.setActiveLeaf(leaf, true, true);
  }

  async openOrCreateYearlyNote(
    date: Moment,
    inNewSplit: boolean
  ): Promise<void> {
    const { workspace } = this.app;

    const startOfYear = date.clone().startOf("year");

    const existingFile = getYearlyNote(date, get(yearlyNotes));

    if (!existingFile) {
      tryToCreateYearlyNote(startOfYear, inNewSplit, this.settings, (file) => {
        activeFile.setFile(file);
      });
      return;
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(existingFile);

    activeFile.setFile(existingFile);
    workspace.setActiveLeaf(leaf, true, true);
  }
}
