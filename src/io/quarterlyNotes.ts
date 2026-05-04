import type { Moment } from "moment";
import type { TFile } from "obsidian";

import type { ISettings } from "src/settings";

import { tryToCreatePeriodicNote } from "./periodicNotes";

export async function tryToCreateQuarterlyNote(
  date: Moment,
  inNewSplit: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  await tryToCreatePeriodicNote("quarterly", date, settings, async (newFile) => {
    const { workspace } = window.app;
    const leaf = inNewSplit
      ? workspace.splitActiveLeaf()
      : workspace.getUnpinnedLeaf();
    await leaf.openFile(newFile, { active: true });
    cb?.(newFile);
  });
}
