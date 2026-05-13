import type { TFile } from "obsidian";
import { getAllPeriodicNotes as helperGetAllPeriodicNotes } from "src/io/periodicNoteHelpers";
import { get, writable } from "svelte/store";

import { defaultSettings, ISettings, Periodicity } from "src/settings";

import { getDateUIDFromFile } from "./utils";

function createPeriodicNotesStore(periodicity: Periodicity) {
  let hasError = false;
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => {
      const currentSettings = get(settings);
      if (!currentSettings[periodicity].enabled) {
        store.set({});
        hasError = false;
        return;
      }
      try {
        const notes = helperGetAllPeriodicNotes(
          periodicity,
          currentSettings[periodicity]
        );
        store.set(notes);
        hasError = false;
      } catch (err) {
        store.set({});
        if (!hasError) {
          // Avoid error being shown multiple times
          console.log(
            `[Calendar] Failed to find ${periodicity} notes folder`,
            err
          );
        }
        hasError = true;
      }
    },
    ...store,
  };
}

// Exporting the stores
export const settings = writable<ISettings>(defaultSettings);
export const dailyNotes = createPeriodicNotesStore("daily");
export const weeklyNotes = createPeriodicNotesStore("weekly");
export const monthlyNotes = createPeriodicNotesStore("monthly");
export const yearlyNotes = createPeriodicNotesStore("yearly");
export const quarterlyNotes = createPeriodicNotesStore("quarterly");

function createSelectedFileStore() {
  const store = writable<string>(null);

  return {
    setFile: (file: TFile) => {
      const id = getDateUIDFromFile(file, get(settings));
      store.set(id);
    },
    ...store,
  };
}

export const activeFile = createSelectedFileStore();
