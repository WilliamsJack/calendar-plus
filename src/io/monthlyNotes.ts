import type { Moment } from "moment";
import { Notice } from "obsidian";
import type { TFile } from "obsidian";

import {
  applyTemplateTokens,
  ensureParentFolderExists,
  getPeriodicNotePath,
  getTemplateInfo,
} from "./periodicNoteHelpers";
import type { ISettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

/**
 * Create a monthly note for the given date using Calendar-owned settings, then
 * open it. Does not use obsidian-daily-notes-interface or core Daily Notes.
 */
export async function tryToCreateMonthlyNote(
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  const { workspace, vault } = window.app;
  const monthlySettings = settings.monthly;
  const filename = date.format(monthlySettings.format);
  const path = getPeriodicNotePath(monthlySettings, date);

  const createFile = async () => {
    await ensureParentFolderExists(path);
    const { contents: rawTemplate, foldInfo } = await getTemplateInfo(
      monthlySettings.template
    );
    const expanded = applyTemplateTokens(
      rawTemplate,
      "monthly",
      date,
      monthlySettings.format
    );

    let newFile: TFile;
    try {
      newFile = await vault.create(path, expanded);
    } catch (err) {
      console.error(`[Calendar] Failed to create file: '${path}'`, err);
      new Notice("Unable to create new file.");
      throw err;
    }

    if (foldInfo) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.app as any).foldManager?.save?.(newFile, foldInfo);
    }

    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(newFile, { active: true });
    cb?.(newFile);
  };

  if (settings.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: createFile,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Monthly Note",
    });
  } else {
    await createFile();
  }
}
