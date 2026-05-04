import { App, PluginSettingTab, Setting } from "obsidian";
import type { ILocaleOverride, IWeekStartOption } from "obsidian-calendar-ui";

import {
  DEFAULT_DAILY_NOTE_FORMAT,
  DEFAULT_MONTHLY_NOTE_FORMAT,
  DEFAULT_QUARTERLY_NOTE_FORMAT,
  DEFAULT_WEEKLY_NOTE_FORMAT,
  DEFAULT_WORDS_PER_DOT,
  DEFAULT_YEARLY_NOTE_FORMAT,
} from "src/constants";

import type CalendarPlugin from "./main";

export type Periodicity =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface PeriodicNoteSettings {
  enabled: boolean;
  format: string;
  folder: string;
  template: string;
}

export interface ISettings {
  wordsPerDot: number;
  weekStart: IWeekStartOption;
  shouldConfirmBeforeCreate: boolean;
  ctrlClickOpensInNewTab: boolean;
  showQuarter: boolean;
  // Weekly Note settings
  showWeeklyNote: boolean;
  showWeeklyNoteRight: boolean;
  weeklyNoteFormat: string;
  weeklyNoteTemplate: string;
  weeklyNoteFolder: string;

  localeOverride: ILocaleOverride;

  // Calendar-owned periodic note settings (not yet wired up).
  daily: PeriodicNoteSettings;
  weekly: PeriodicNoteSettings;
  monthly: PeriodicNoteSettings;
  quarterly: PeriodicNoteSettings;
  yearly: PeriodicNoteSettings;
}

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const defaultSettings = Object.freeze({
  shouldConfirmBeforeCreate: true,
  weekStart: "locale" as IWeekStartOption,
  ctrlClickOpensInNewTab: false,

  wordsPerDot: DEFAULT_WORDS_PER_DOT,

  showWeeklyNote: false,
  showWeeklyNoteRight: false,
  weeklyNoteFormat: "",
  weeklyNoteTemplate: "",
  weeklyNoteFolder: "",

  localeOverride: "system-default",

  showQuarter: false, // Added default value for showQuarter

  daily: {
    enabled: false,
    format: DEFAULT_DAILY_NOTE_FORMAT,
    folder: "",
    template: "",
  } as PeriodicNoteSettings,
  weekly: {
    enabled: false,
    format: DEFAULT_WEEKLY_NOTE_FORMAT,
    folder: "",
    template: "",
  } as PeriodicNoteSettings,
  monthly: {
    enabled: false,
    format: DEFAULT_MONTHLY_NOTE_FORMAT,
    folder: "",
    template: "",
  } as PeriodicNoteSettings,
  quarterly: {
    enabled: false,
    format: DEFAULT_QUARTERLY_NOTE_FORMAT,
    folder: "",
    template: "",
  } as PeriodicNoteSettings,
  yearly: {
    enabled: false,
    format: DEFAULT_YEARLY_NOTE_FORMAT,
    folder: "",
    template: "",
  } as PeriodicNoteSettings,
});

export class CalendarSettingsTab extends PluginSettingTab {
  private plugin: CalendarPlugin;

  constructor(app: App, plugin: CalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    this.containerEl.createEl("h3", {
      text: "General Settings",
    });
    this.addDotThresholdSetting();
    this.addWeekStartSetting();
    this.addCtrlClickSetting();
    this.addConfirmCreateSetting();
    this.addShowWeeklyNoteRightSetting();

    this.containerEl.createEl("h3", {
      text: "Periodic Notes",
    });
    this.containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "Calendar manages periodic notes directly. To use existing notes, enter the same folder and date format you already use.",
    });
    this.displayPeriodicNoteSettings("daily", "Daily notes", DEFAULT_DAILY_NOTE_FORMAT);
    this.displayPeriodicNoteSettings("weekly", "Weekly notes", DEFAULT_WEEKLY_NOTE_FORMAT);
    this.displayPeriodicNoteSettings("monthly", "Monthly notes", DEFAULT_MONTHLY_NOTE_FORMAT);
    this.displayPeriodicNoteSettings("quarterly", "Quarterly notes", DEFAULT_QUARTERLY_NOTE_FORMAT);
    this.displayPeriodicNoteSettings("yearly", "Yearly notes", DEFAULT_YEARLY_NOTE_FORMAT);

    this.containerEl.createEl("h3", {
      text: "Advanced Settings",
    });
    this.addLocaleOverrideSetting();
  }

  addDotThresholdSetting(): void {
    new Setting(this.containerEl)
      .setName("Words per dot")
      .setDesc("How many words should be represented by a single dot?")
      .addText((textfield) => {
        textfield.setPlaceholder(String(DEFAULT_WORDS_PER_DOT));
        textfield.inputEl.type = "number";
        textfield.setValue(String(this.plugin.options.wordsPerDot));
        textfield.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            wordsPerDot: value !== "" ? Number(value) : undefined,
          }));
        });
      });
  }

  addWeekStartSetting(): void {
    const { moment } = window;

    const localizedWeekdays = moment.weekdays();
    const localeWeekStartNum = window._bundledLocaleWeekSpec.dow;
    const localeWeekStart = moment.weekdays()[localeWeekStartNum];

    new Setting(this.containerEl)
      .setName("Start week on:")
      .setDesc(
        "Choose what day of the week to start. Select 'Locale default' to use the default specified by moment.js"
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("locale", `Locale default (${localeWeekStart})`);
        localizedWeekdays.forEach((day, i) => {
          dropdown.addOption(weekdays[i], day);
        });
        dropdown.setValue(this.plugin.options.weekStart);
        dropdown.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            weekStart: value as IWeekStartOption,
          }));
        });
      });
  }
  addCtrlClickSetting(): void {
    new Setting(this.containerEl)
      .setName("Ctrl + Click Behaviour")
      .setDesc("Set the behaviour of Ctrl + Clicking on a date")
      .addDropdown((dropdown) => {
        dropdown.addOption("new-tab", "Open in new tab");
        dropdown.addOption("new-split", "Open in new split");
        dropdown.setValue(
          this.plugin.options.ctrlClickOpensInNewTab ? "new-tab" : "new-split"
        );
        dropdown.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            ctrlClickOpensInNewTab: value === "new-tab",
          }));
        });
      });
  }
  addConfirmCreateSetting(): void {
    new Setting(this.containerEl)
      .setName("Confirm before creating new note")
      .setDesc("Show a confirmation modal before creating a new note")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.shouldConfirmBeforeCreate);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            shouldConfirmBeforeCreate: value,
          }));
        });
      });
  }

  addShowWeeklyNoteRightSetting(): void {
    new Setting(this.containerEl)
      .setName("Change week number side")
      .setDesc("Enable this to show week numbers to the right of the calendar")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.options.showWeeklyNoteRight);
        toggle.onChange(async (value) => {
          this.plugin.writeOptions(() => ({ showWeeklyNoteRight: value }));
          this.display(); // show/hide weekly settings
        });
      });
  }

  private displayPeriodicNoteSettings(
    periodicity: Periodicity,
    label: string,
    defaultFormat: string
  ): void {
    const pnSettings = this.plugin.options[periodicity];

    new Setting(this.containerEl).setName(label).setHeading();

    new Setting(this.containerEl)
      .setName("Enable")
      .setDesc(`Create and manage ${label.toLowerCase()} from Calendar`)
      .addToggle((toggle) => {
        toggle.setValue(pnSettings.enabled);
        toggle.onChange(async (value) => {
          await this.plugin.writeOptions((prev) => ({
            [periodicity]: { ...prev[periodicity], enabled: value },
          } as Partial<ISettings>));
          this.display();
        });
      });

    if (!pnSettings.enabled) return;

    new Setting(this.containerEl)
      .setName("Date format")
      .setDesc("Moment.js format string for note filenames")
      .addText((text) => {
        text.setPlaceholder(defaultFormat);
        text.setValue(pnSettings.format);
        text.onChange(async (value) => {
          await this.plugin.writeOptions((prev) => ({
            [periodicity]: { ...prev[periodicity], format: value },
          } as Partial<ISettings>));
        });
      });

    new Setting(this.containerEl)
      .setName("Folder")
      .setDesc("Notes are created here. Leave blank for vault root.")
      .addText((text) => {
        text.setPlaceholder("Example: folder/subfolder");
        text.setValue(pnSettings.folder);
        text.onChange(async (value) => {
          await this.plugin.writeOptions((prev) => ({
            [periodicity]: { ...prev[periodicity], folder: value },
          } as Partial<ISettings>));
        });
      });

    new Setting(this.containerEl)
      .setName("Template file")
      .setDesc("Path to template file. Leave blank for no template.")
      .addText((text) => {
        text.setPlaceholder("Example: templates/daily");
        text.setValue(pnSettings.template);
        text.onChange(async (value) => {
          await this.plugin.writeOptions((prev) => ({
            [periodicity]: { ...prev[periodicity], template: value },
          } as Partial<ISettings>));
        });
      });
  }

  addLocaleOverrideSetting(): void {
    const { moment } = window;

    const sysLocale = navigator.language?.toLowerCase();

    new Setting(this.containerEl)
      .setName("Override locale:")
      .setDesc(
        "Set this if you want to use a locale different from the default"
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("system-default", `Same as system (${sysLocale})`);
        moment.locales().forEach((locale) => {
          dropdown.addOption(locale, locale);
        });
        dropdown.setValue(this.plugin.options.localeOverride);
        dropdown.onChange(async (value) => {
          this.plugin.writeOptions(() => ({
            localeOverride: value as ILocaleOverride,
          }));
        });
      });
  }
}
