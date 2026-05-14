import { moment } from "obsidian";

// ---------------------------------------------------------------------------
// Local moment-related types.
//
// Obsidian bundles moment.js and re-exports the runtime `moment` value, but
// it does not re-export moment's namespace types. Importing types directly
// from the `moment` package gets flagged by Obsidian's community-plugin
// review ("the moment package is bundled with Obsidian"), so we define what
// we need locally — derived from `typeof moment` where possible — and have
// source files import from this module instead.
// ---------------------------------------------------------------------------

/**
 * A moment instance, derived from the call signature of Obsidian's bundled
 * `moment` factory. Carries moment's full method surface (`.add`, `.clone`,
 * `.format`, etc.) without referencing the `moment` package by name.
 */
export type Moment = ReturnType<typeof moment>;

/**
 * A moment locale object, derived from `moment.localeData()`. Used by the
 * vendored calendar UI to pass locale information into the calendar grid.
 */
export type Locale = ReturnType<typeof moment.localeData>;

/**
 * Locale week specification — the shape `moment.updateLocale` accepts under
 * its `week` key. Stable across moment 2.x. Defined locally so this module
 * is the only seam between Calendar Plus and moment's internal types.
 */
export interface WeekSpec {
  dow: number;
  doy?: number;
}

/**
 * Subset of moment's `unitOfTime.DurationConstructor` covering the unit
 * strings Calendar Plus passes to `.add`, `.startOf`, `.endOf`, and similar
 * methods. Wide enough to accept long names, plurals, and single-letter
 * shortcuts; defined locally so call sites don't reach into moment's types.
 */
export type DurationUnit =
  | "year" | "years" | "y"
  | "quarter" | "quarters" | "Q"
  | "month" | "months" | "M"
  | "week" | "weeks" | "w"
  | "isoWeek" | "isoWeeks"
  | "day" | "days" | "d"
  | "date" | "dates" | "D"
  | "hour" | "hours" | "h"
  | "minute" | "minutes" | "m"
  | "second" | "seconds" | "s";
