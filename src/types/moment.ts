import type { Locale, Moment, unitOfTime } from "moment";

// ---------------------------------------------------------------------------
// Central moment-type seam.
//
// Obsidian bundles moment.js and re-exports the runtime `moment` value, so
// every source file gets the runtime `moment` via `import { moment } from
// "obsidian"`. Type-only access, however, has to come from the moment package
// itself: deriving `ReturnType<typeof moment>` from Obsidian's re-export
// collapses to `any` under the community-plugin checker's type-aware lint
// pass, which then flags every `.format` / `.clone` / `.add` / etc. call as
// unsafe-member-access / unsafe-call. To avoid that warning explosion AND
// avoid scattering `"moment"` imports across the source tree, this single
// file imports types from `"moment"` and re-exports them. Consumers
// `import type { Moment } from "src/types/moment"` everywhere else. The
// import below is the only `"moment"` import in `src/`; the Obsidian checker
// flags it as a single non-blocking `no-restricted-imports` warning.
// ---------------------------------------------------------------------------

export type { Locale, Moment };

/**
 * Locale week specification — the shape `moment.updateLocale` accepts under
 * its `week` key. Stable across moment 2.x; defined locally to keep this
 * module's surface deliberate.
 */
export interface WeekSpec {
  dow: number;
  doy?: number;
}

/**
 * Moment's unit-of-time strings accepted by `.add`, `.startOf`, `.endOf`,
 * and similar duration-flavored methods. Re-exported from moment's
 * `unitOfTime.DurationConstructor` so the checker has the full union (long
 * names, plurals, and single-letter shortcuts) to validate against.
 */
export type DurationUnit = unitOfTime.DurationConstructor;
