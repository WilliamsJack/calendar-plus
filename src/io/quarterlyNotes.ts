import type { Moment } from "src/types/moment";
import type { TFile } from "obsidian";

import type { ISettings } from "src/settings";

import { tryToCreatePeriodicNoteAndOpen } from "./periodicNotes";

export function tryToCreateQuarterlyNote(
  date: Moment,
  ctrlPressed: boolean,
  settings: ISettings,
  cb?: (newFile: TFile) => void
): Promise<void> {
  return tryToCreatePeriodicNoteAndOpen("quarterly", date, ctrlPressed, settings, cb);
}
