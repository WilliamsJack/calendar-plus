import type { Moment } from "moment";
import { Notice } from "obsidian";
import type { TFile } from "obsidian";

import type {
  ISettings,
  Periodicity,
  PeriodicNoteSettings,
} from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

import {
  applyTemplateTokens,
  ensureParentFolderExists,
  getPeriodicNotePath,
  getTemplateInfo,
} from "./periodicNoteHelpers";

const PERIODICITY_LABELS: Record<Periodicity, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

/**
 * Create a periodic note on disk for the given date and return the new
 * `TFile`. Does not open the file — that is the caller's responsibility.
 *
 * Reads format/folder/template only from the supplied per-period settings.
 *
 * Throws on file-create failure (after showing a Notice) so callers can avoid
 * post-creation work like opening a leaf.
 */
export async function createPeriodicNote(
  periodicity: Periodicity,
  date: Moment,
  perPeriodSettings: PeriodicNoteSettings
): Promise<TFile> {
  const path = getPeriodicNotePath(perPeriodSettings, date);
  await ensureParentFolderExists(path);

  const { contents: rawTemplate, foldInfo } = await getTemplateInfo(
    perPeriodSettings.template
  );
  const expanded = applyTemplateTokens(
    rawTemplate,
    periodicity,
    date,
    perPeriodSettings.format
  );

  const { vault } = window.app;
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
    (window.app as any).foldManager?.save?.(createdFile, foldInfo);
  }

  return createdFile;
}

/**
 * Create a periodic note with the same confirm-before-create UX the existing
 * per-period IO files use. The optional callback fires after a successful
 * create so callers can open / focus. The callback is awaited, so async
 * callbacks (e.g. openFile then update active-file state) complete before
 * this function resolves.
 */
export async function tryToCreatePeriodicNote(
  periodicity: Periodicity,
  date: Moment,
  settings: ISettings,
  cb?: (newFile: TFile) => void | Promise<void>
): Promise<void> {
  const perPeriod = settings[periodicity];
  const filename = date.format(perPeriod.format);

  const create = async () => {
    const file = await createPeriodicNote(periodicity, date, perPeriod);
    await cb?.(file);
  };

  if (settings.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: create,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: `New ${PERIODICITY_LABELS[periodicity]} Note`,
    });
  } else {
    await create();
  }
}
