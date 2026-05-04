import type { TFile } from "obsidian";
import { getAllPeriodicNotes as helperGetAllPeriodicNotes } from "src/io/periodicNoteHelpers";
import { get, writable } from "svelte/store";

import { defaultSettings, ISettings } from "src/settings";

import { getDateUIDFromFile } from "./utils";

function createDailyNotesStore() {
  let hasError = false;
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => {
      const currentSettings = get(settings);
      if (!currentSettings.daily.enabled) {
        store.set({});
        hasError = false;
        return;
      }
      try {
        const notes = helperGetAllPeriodicNotes("daily", currentSettings.daily);
        store.set(notes);
        hasError = false;
      } catch (err) {
        store.set({});
        if (!hasError) {
          // Avoid error being shown multiple times
          console.log("[Calendar] Failed to find daily notes folder", err);
        }
        hasError = true;
      }
    },
    ...store,
  };
}

function createWeeklyNotesStore() {
  let hasError = false;
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => {
      const currentSettings = get(settings);
      if (!currentSettings.weekly.enabled) {
        store.set({});
        hasError = false;
        return;
      }
      try {
        const notes = helperGetAllPeriodicNotes("weekly", currentSettings.weekly);
        store.set(notes);
        hasError = false;
      } catch (err) {
        store.set({});
        if (!hasError) {
          // Avoid error being shown multiple times
          console.log("[Calendar] Failed to find weekly notes folder", err);
        }
        hasError = true;
      }
    },
    ...store,
  };
}

function createMonthlyNotesStore() {
  let hasError = false;
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => {
      const currentSettings = get(settings);
      if (!currentSettings.monthly.enabled) {
        store.set({});
        hasError = false;
        return;
      }
      try {
        const notes = helperGetAllPeriodicNotes("monthly", currentSettings.monthly);
        store.set(notes);
        hasError = false;
      } catch (err) {
        store.set({});
        if (!hasError) {
          // Avoid error being shown multiple times
          console.log("[Calendar] Failed to find monthly notes folder", err);
        }
        hasError = true;
      }
    },
    ...store,
  };
}

function createYearlyNotesStore() {
  let hasError = false;
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => {
      const currentSettings = get(settings);
      if (!currentSettings.yearly.enabled) {
        store.set({});
        hasError = false;
        return;
      }
      try {
        const notes = helperGetAllPeriodicNotes("yearly", currentSettings.yearly);
        store.set(notes);
        hasError = false;
      } catch (err) {
        store.set({});
        if (!hasError) {
          // Avoid error being shown multiple times
          console.log("[Calendar] Failed to find yearly notes folder", err);
        }
        hasError = true;
      }
    },
    ...store,
  };
}

function createQuarterlyNotesStore() {
  let hasError = false;
  const store = writable<Record<string, TFile>>(null);
  return {
    reindex: () => {
      const currentSettings = get(settings);
      if (!currentSettings.quarterly.enabled) {
        store.set({});
        hasError = false;
        return;
      }
      try {
        const notes = helperGetAllPeriodicNotes("quarterly", currentSettings.quarterly);
        store.set(notes);
        hasError = false;
      } catch (err) {
        store.set({});
        if (!hasError) {
          // Avoid error being shown multiple times
          console.log("[Calendar] Failed to find quarterly notes folder", err);
        }
        hasError = true;
      }
    },
    ...store,
  };
}

// Exporting the stores
export const settings = writable<ISettings>(defaultSettings);
export const dailyNotes = createDailyNotesStore();
export const weeklyNotes = createWeeklyNotesStore();
export const monthlyNotes = createMonthlyNotesStore();
export const yearlyNotes = createYearlyNotesStore();
export const quarterlyNotes = createQuarterlyNotesStore(); // Added quarterlyNotes store

function createSelectedFileStore() {
  const store = writable<string>(null);

  return {
    setFile: (file: TFile) => {
      const id = getDateUIDFromFile(file);
      store.set(id);
    },
    ...store,
  };
}

export const activeFile = createSelectedFileStore();
