import type { Moment } from "moment";
import { Notice } from "obsidian";
import type { TFile } from "obsidian";

import {
  DEFAULT_DAILY_NOTE_FORMAT,
  DEFAULT_MONTHLY_NOTE_FORMAT,
  DEFAULT_QUARTERLY_NOTE_FORMAT,
  DEFAULT_WEEKLY_NOTE_FORMAT,
  DEFAULT_YEARLY_NOTE_FORMAT,
} from "src/constants";
import type { Periodicity, PeriodicNoteSettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

import {
  applyTemplateTokens,
  ensureParentFolderExists,
  getAllPeriodicNotes as helperGetAllPeriodicNotes,
  getDateUID,
  getPeriodicNote as helperGetPeriodicNote,
  getPeriodicNotePath as helperGetPeriodicNotePath,
  getPeriodicityUnit,
  getTemplateInfo,
} from "./periodicNoteHelpers";
import type { MomentUnitOfTime } from "./periodicNoteHelpers";

import type CalendarPlugin from "src/main";

// ---------------------------------------------------------------------------
// Settings access
//
// All reads in this module go through `getPeriodicNoteSettings`. It is the
// only place that consults the plugin's settings object, and it never reads
// from the Periodic Notes plugin or the Obsidian core Daily Notes plugin.
// ---------------------------------------------------------------------------

export function getPeriodicNoteSettings(
  plugin: CalendarPlugin,
  periodicity: Periodicity
): PeriodicNoteSettings {
  return plugin.options[periodicity];
}

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

export function getAllPeriodicNotes(
  plugin: CalendarPlugin,
  periodicity: Periodicity
): Record<string, TFile> {
  const settings = getPeriodicNoteSettings(plugin, periodicity);
  if (!settings.enabled) return {};
  return helperGetAllPeriodicNotes(periodicity, settings);
}

export function getPeriodicNote(
  plugin: CalendarPlugin,
  periodicity: Periodicity,
  date: Moment
): TFile | null {
  const settings = getPeriodicNoteSettings(plugin, periodicity);
  if (!settings.enabled) return null;

  let allNotes: Record<string, TFile>;
  try {
    allNotes = helperGetAllPeriodicNotes(periodicity, settings);
  } catch {
    // Folder missing or inaccessible — treat as "no existing note" so callers
    // can fall through to the create-flow without surfacing an error.
    return null;
  }
  return helperGetPeriodicNote(date, periodicity, allNotes);
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

/**
 * Create a periodic note on disk for the given date and return the new
 * `TFile`. Does not open the file — that is the caller's responsibility.
 *
 * Reads format/folder/template from Calendar's own settings only.
 *
 * Throws on file-create failure (after showing a Notice) so callers can avoid
 * post-creation work like opening a leaf.
 */
export async function createPeriodicNote(
  plugin: CalendarPlugin,
  periodicity: Periodicity,
  date: Moment
): Promise<TFile> {
  const settings = getPeriodicNoteSettings(plugin, periodicity);
  const path = helperGetPeriodicNotePath(settings, date);
  await ensureParentFolderExists(path);

  const { contents: rawTemplate, foldInfo } = await getTemplateInfo(
    settings.template
  );
  const expanded = applyTemplateTokens(
    rawTemplate,
    periodicity,
    date,
    settings.format
  );

  const { vault } = plugin.app;
  let createdFile: TFile;
  try {
    createdFile = await vault.create(path, expanded);
  } catch (err) {
    console.error(`[Calendar] Failed to create file: '${path}'`, err);
    new Notice("Unable to create new file.");
    throw err;
  }

  if (foldInfo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (plugin.app as any).foldManager?.save?.(createdFile, foldInfo);
  }

  return createdFile;
}

/**
 * Create a periodic note with the same confirm-before-create UX the existing
 * per-period IO files use. Reuses `createConfirmationDialog` from
 * `src/ui/modal.ts` unchanged.
 *
 * Like `createPeriodicNote`, this does not open the file. The optional
 * callback fires after a successful create so callers can open / focus.
 */
export async function tryToCreatePeriodicNote(
  plugin: CalendarPlugin,
  periodicity: Periodicity,
  date: Moment,
  cb?: (newFile: TFile) => void
): Promise<void> {
  const settings = getPeriodicNoteSettings(plugin, periodicity);
  const filename = date.format(settings.format);
  const config = periodConfigs[periodicity];

  const create = async () => {
    const file = await createPeriodicNote(plugin, periodicity, date);
    cb?.(file);
  };

  if (plugin.options.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: create,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: `New ${config.label} Note`,
    });
  } else {
    await create();
  }
}

// ---------------------------------------------------------------------------
// Per-periodicity config table
// ---------------------------------------------------------------------------

export interface IPeriodicNoteConfig {
  periodicity: Periodicity;
  label: string;
  unit: MomentUnitOfTime;
  defaultFormat: string;
  getSettings(plugin: CalendarPlugin): PeriodicNoteSettings;
  getDateUID(date: Moment): string;
  getAllNotes(plugin: CalendarPlugin): Record<string, TFile>;
  getNote(plugin: CalendarPlugin, date: Moment): TFile | null;
  getNotePath(plugin: CalendarPlugin, date: Moment): string;
  createNote(plugin: CalendarPlugin, date: Moment): Promise<TFile>;
}

function makeConfig(
  periodicity: Periodicity,
  label: string,
  defaultFormat: string
): IPeriodicNoteConfig {
  return {
    periodicity,
    label,
    unit: getPeriodicityUnit(periodicity),
    defaultFormat,
    getSettings: (plugin) => getPeriodicNoteSettings(plugin, periodicity),
    getDateUID: (date) => getDateUID(date, periodicity),
    getAllNotes: (plugin) => getAllPeriodicNotes(plugin, periodicity),
    getNote: (plugin, date) => getPeriodicNote(plugin, periodicity, date),
    getNotePath: (plugin, date) =>
      helperGetPeriodicNotePath(
        getPeriodicNoteSettings(plugin, periodicity),
        date
      ),
    createNote: (plugin, date) => createPeriodicNote(plugin, periodicity, date),
  };
}

export const periodConfigs: Record<Periodicity, IPeriodicNoteConfig> = {
  daily: makeConfig("daily", "Daily", DEFAULT_DAILY_NOTE_FORMAT),
  weekly: makeConfig("weekly", "Weekly", DEFAULT_WEEKLY_NOTE_FORMAT),
  monthly: makeConfig("monthly", "Monthly", DEFAULT_MONTHLY_NOTE_FORMAT),
  quarterly: makeConfig(
    "quarterly",
    "Quarterly",
    DEFAULT_QUARTERLY_NOTE_FORMAT
  ),
  yearly: makeConfig("yearly", "Yearly", DEFAULT_YEARLY_NOTE_FORMAT),
};
