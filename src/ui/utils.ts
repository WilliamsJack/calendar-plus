import type { TFile } from "obsidian";
import {
  getDateFromFile as helperGetDateFromFile,
  getDateUID as helperGetDateUID,
} from "src/io/periodicNoteHelpers";
import type { ISettings } from "src/settings";

export const classList = (obj: Record<string, boolean>): string[] => {
  return Object.entries(obj)
    .filter(([_k, v]) => !!v)
    .map(([k, _k]) => k);
};

export function partition(
  arr: string[],
  predicate: (elem: string) => boolean
): [string[], string[]] {
  const pass: string[] = [];
  const fail: string[] = [];

  arr.forEach((elem) => {
    if (predicate(elem)) {
      pass.push(elem);
    } else {
      fail.push(elem);
    }
  });

  return [pass, fail];
}

/**
 * Lookup the dateUID for a given file. It compares the filename
 * to the daily and weekly note formats to find a match.
 */
export function getDateUIDFromFile(file: TFile | null, settings: ISettings): string | null {
  if (!file) {
    return null;
  }

  if (settings.daily.enabled) {
    const date = helperGetDateFromFile(file, "daily", settings.daily.format);
    if (date) {
      return helperGetDateUID(date, "daily");
    }
  }

  if (settings.weekly.enabled) {
    const date = helperGetDateFromFile(file, "weekly", settings.weekly.format);
    if (date) {
      return helperGetDateUID(date, "weekly");
    }
  }

  return null;
}
