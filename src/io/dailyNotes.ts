import type { Moment } from "moment";
import { Notice } from "obsidian";
import type { TFile, WorkspaceLeaf } from "obsidian";

import {
  applyTemplateTokens,
  ensureParentFolderExists,
  getPeriodicNotePath,
  getTemplateInfo,
} from "./periodicNoteHelpers";
import type { ISettings } from "src/settings";
import { createConfirmationDialog } from "src/ui/modal";

/**
 * Create a daily note for the given date using Calendar-owned settings, then
 * open it. Does not use obsidian-daily-notes-interface or core Daily Notes.
 */
export async function tryToCreateDailyNote(
  date: Moment,
  ctrlPressed: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  const { workspace, vault } = window.app;
  const dailySettings = settings.daily;
  const filename = date.format(dailySettings.format);
  const path = getPeriodicNotePath(dailySettings, date);

  const createFile = async () => {
    await ensureParentFolderExists(path);
    const { contents: rawTemplate, foldInfo } = await getTemplateInfo(
      dailySettings.template
    );
    const expanded = applyTemplateTokens(
      rawTemplate,
      "daily",
      date,
      dailySettings.format
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

    let leaf: WorkspaceLeaf;
    if (ctrlPressed) {
      if (settings.ctrlClickOpensInNewTab) {
        leaf = workspace.getLeaf("tab");
      } else {
        leaf = workspace.getLeaf("split", "vertical");
      }
    } else {
      leaf = workspace.getLeaf(false);
    }
    await leaf.openFile(newFile, { active: true });
    cb?.(newFile);
  };

  if (settings.shouldConfirmBeforeCreate) {
    createConfirmationDialog({
      cta: "Create",
      onAccept: createFile,
      text: `File ${filename} does not exist. Would you like to create it?`,
      title: "New Daily Note",
    });
  } else {
    await createFile();
  }
}
