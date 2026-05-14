import type { Moment } from "src/types/moment";
import type { TFile, WorkspaceLeaf } from "obsidian";

import type { ISettings } from "src/settings";

import { tryToCreatePeriodicNote } from "./periodicNotes";

export async function tryToCreateDailyNote(
  date: Moment,
  ctrlPressed: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  await tryToCreatePeriodicNote("daily", date, settings, async (newFile) => {
    const { workspace } = window.app;
    let leaf: WorkspaceLeaf;
    if (ctrlPressed) {
      leaf = settings.ctrlClickOpensInNewTab
        ? workspace.getLeaf("tab")
        : workspace.getLeaf("split", "vertical");
    } else {
      leaf = workspace.getLeaf(false);
    }
    await leaf.openFile(newFile, { active: true });
    cb?.(newFile);
  });
}
