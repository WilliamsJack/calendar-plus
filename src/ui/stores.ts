import type { TFile } from "obsidian";
import {
  getAllPeriodicNotes as helperGetAllPeriodicNotes,
  getDateFromFile,
  getDateUID,
  isFileInConfiguredFolder,
} from "src/io/periodicNoteHelpers";
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
    // Incremental update for a single newly-created file. No-op when the
    // periodicity is disabled, when the file is outside the configured folder,
    // or when the basename doesn't parse against the configured format.
    // Returns true if the store was mutated.
    addFile: (file: TFile): boolean => {
      const currentSettings = get(settings);
      const periodSettings = currentSettings[periodicity];
      if (!periodSettings.enabled) return false;
      if (!isFileInConfiguredFolder(file, periodSettings)) return false;
      const date = getDateFromFile(file, periodicity, periodSettings.format);
      if (!date) return false;
      const uid = getDateUID(date, periodicity);
      store.update((current) => ({ ...(current ?? {}), [uid]: file }));
      return true;
    },
    // Incremental remove for a single deleted file. Same guards as addFile.
    // Returns true if the UID was actually present in the store.
    removeFile: (file: TFile): boolean => {
      const currentSettings = get(settings);
      const periodSettings = currentSettings[periodicity];
      if (!periodSettings.enabled) return false;
      if (!isFileInConfiguredFolder(file, periodSettings)) return false;
      const date = getDateFromFile(file, periodicity, periodSettings.format);
      if (!date) return false;
      const uid = getDateUID(date, periodicity);
      let removed = false;
      store.update((current) => {
        if (!current || !(uid in current)) return current;
        removed = true;
        const next = { ...current };
        delete next[uid];
        return next;
      });
      return removed;
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
