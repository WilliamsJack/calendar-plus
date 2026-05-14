import type { Moment } from "src/types/moment";
import type { TFile } from "obsidian";

import type { ISettings } from "src/settings";

import { tryToCreatePeriodicNote } from "./periodicNotes";

export async function tryToCreateMonthlyNote(
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  await tryToCreatePeriodicNote("monthly", date, settings, async (newFile) => {
    const { workspace } = window.app;
    const leaf = inNewSplit
      ? workspace.getLeaf("split", "vertical")
      : workspace.getLeaf(false);
    await leaf.openFile(newFile, { active: true });
    cb?.(newFile);
  });
}
