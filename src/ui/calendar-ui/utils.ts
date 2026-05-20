import { Platform } from "obsidian";

import { moment } from "src/types/moment";
import type { Moment } from "src/types/moment";

import type { IMonth, IWeek } from "./types";

export function isMetaPressed(e: MouseEvent): boolean {
  return Platform.isMacOS ? e.metaKey : e.ctrlKey;
}

export function getDaysOfWeek(..._args: unknown[]): string[] {
  return moment.weekdaysShort(true);
}

/**
 * Returns true when the given date falls on one of the configured weekend
 * days. `weekendDays` carries JS/Moment weekday numbers
 * (0 = Sunday … 6 = Saturday); the lookup uses `date.day()` which is in the
 * same index space. Independent of locale week-start.
 */
export function isWeekend(date: Moment, weekendDays: number[]): boolean {
  return weekendDays.includes(date.day());
}

export function getStartOfWeek(days: Moment[]): Moment {
  return days[0].weekday(0);
}

/**
 * Generate a 2D array of daily information to power
 * the calendar view.
 */
export function getMonth(displayedMonth: Moment, ..._args: unknown[]): IMonth {
  const locale = moment().locale();
  const month: IMonth = [];
  let week: IWeek;

  const startOfMonth = displayedMonth.clone().locale(locale).date(1);
  const startOffset = startOfMonth.weekday();
  let date: Moment = startOfMonth.clone().subtract(startOffset, "days");

  for (let _day = 0; _day < 42; _day++) {
    if (_day % 7 === 0) {
      week = {
        days: [],
        weekNum: date.week(),
      };
      month.push(week);
    }

    week.days.push(date);
    date = date.clone().add(1, "days");
  }

  return month;
}
