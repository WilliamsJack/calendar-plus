import type { Moment } from "moment";
import type { TFile } from "obsidian";
import type { ICalendarSource, IDayMetadata, IDot } from "obsidian-calendar-ui";
import { getPeriodicNote as helperGetPeriodicNote } from "src/io/periodicNoteHelpers";
import { get } from "svelte/store";

import { dailyNotes, weeklyNotes } from "../stores";
import { classList } from "../utils";

const getStreakClasses = (file: TFile): string[] => {
  return classList({
    "has-note": !!file,
  });
};

const getNoteExistsDots = (file: TFile | null): IDot[] => {
  if (!file) return [];
  return [{ color: "default", isFilled: true }];
};

export const streakSource: ICalendarSource = {
  getDailyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = helperGetPeriodicNote(date, "daily", get(dailyNotes) ?? {});
    return {
      classes: getStreakClasses(file),
      dots: getNoteExistsDots(file),
    };
  },

  getWeeklyMetadata: async (date: Moment): Promise<IDayMetadata> => {
    const file = helperGetPeriodicNote(date, "weekly", get(weeklyNotes) ?? {});
    return {
      classes: getStreakClasses(file),
      dots: getNoteExistsDots(file),
    };
  },
};
