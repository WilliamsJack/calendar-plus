import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IDayMetadata, IDot } from "obsidian-calendar-ui";
import { getPeriodicNote as helperGetPeriodicNote } from "src/io/periodicNoteHelpers";
import { get } from "svelte/store";

import { dailyNotes, weeklyNotes } from "../stores";

export async function getNumberOfRemainingTasks(note: TFile): Promise<number> {
  if (!note) {
    return 0;
  }

  const { vault } = window.app;
  const fileContents = await vault.cachedRead(note);
  return (fileContents.match(/(-|\*) \[ \]/g) || []).length;
}

export async function getDotsForDailyNote(
  dailyNote: TFile | null
): Promise<IDot[]> {
  if (!dailyNote) {
    return [];
  }
  const numTasks = await getNumberOfRemainingTasks(dailyNote);

  const dots = [];
  if (numTasks) {
    dots.push({
      className: "task",
      color: "default",
      isFilled: false,
    });
  }
  return dots;
}

export const tasksSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = helperGetPeriodicNote(date, "daily", get(dailyNotes) ?? {});
    const dots = await getDotsForDailyNote(file);
    return {
      dots,
    };
  },

  getWeeklyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = helperGetPeriodicNote(date, "weekly", get(weeklyNotes) ?? {});
    const dots = await getDotsForDailyNote(file);

    return {
      dots,
    };
  },
};
