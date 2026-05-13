import type { Moment } from "moment";
import { Notice, normalizePath, TFile, TFolder, Vault } from "obsidian";

import type { Periodicity, PeriodicNoteSettings } from "src/settings";

// ---------------------------------------------------------------------------
// Periodicity → moment unit mapping
// ---------------------------------------------------------------------------

export type MomentUnitOfTime = "day" | "week" | "month" | "quarter" | "year";

const PERIODICITY_TO_UNIT: Record<Periodicity, MomentUnitOfTime> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

export function getPeriodicityUnit(periodicity: Periodicity): MomentUnitOfTime {
  return PERIODICITY_TO_UNIT[periodicity];
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function joinPath(...partSegments: string[]): string {
  let parts: string[] = [];
  for (const seg of partSegments) {
    parts = parts.concat(seg.split("/"));
  }
  const newParts: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    newParts.push(part);
  }
  // Preserve a leading slash if the first segment started with one.
  if (parts[0] === "") newParts.unshift("");
  return newParts.join("/");
}

/**
 * Pure path generation: format the filename, join with the configured folder,
 * and normalize. Does not touch the vault and does not create folders.
 *
 * Safe to call from lookup/detection code. Note creation must additionally
 * call `ensureParentFolderExists(path)` before writing.
 */
export function getPeriodicNotePath(
  settings: PeriodicNoteSettings,
  date: Moment
): string {
  let filename = date.format(settings.format);
  if (!filename.endsWith(".md")) filename += ".md";

  const directory = settings.folder || "";
  return normalizePath(joinPath(directory, filename));
}

/**
 * Given a file path, walk the parent folder chain from the root downward and
 * create any missing ancestor folders. For `Notes/Periodic/Daily/2026-05-03.md`
 * this ensures `Notes`, then `Notes/Periodic`, then `Notes/Periodic/Daily`
 * exist, creating only the ones that don't already.
 *
 * Intended to be called by note-creation code immediately before
 * `vault.create(path, ...)`.
 */
export async function ensureParentFolderExists(path: string): Promise<void> {
  const segments = path.replace(/\\/g, "/").split("/");
  segments.pop(); // drop the basename — we only care about the parent chain
  if (segments.length === 0) return;

  const { vault } = window.app;
  const accumulated: string[] = [];
  for (const segment of segments) {
    accumulated.push(segment);
    const ancestor = joinPath(...accumulated);
    // Skip empty results from a leading "/" or a stray empty segment.
    if (!ancestor) continue;
    const normalized = normalizePath(ancestor);
    if (!vault.getAbstractFileByPath(normalized)) {
      await vault.createFolder(normalized);
    }
  }
}

// ---------------------------------------------------------------------------
// Template lookup + token expansion
// ---------------------------------------------------------------------------

export interface ITemplateInfo {
  contents: string;
  // `app.foldManager` is not in the public Obsidian d.ts, so we keep the
  // returned blob opaque. Callers only pass it back to `foldManager.save`.
  foldInfo: unknown | null;
}

export async function getTemplateInfo(template: string): Promise<ITemplateInfo> {
  if (!template || template.trim() === "") {
    return { contents: "", foldInfo: null };
  }

  const templatePath = normalizePath(template);
  if (templatePath === "/") {
    return { contents: "", foldInfo: null };
  }

  const { metadataCache, vault } = window.app;
  try {
    const templateFile = metadataCache.getFirstLinkpathDest(templatePath, "");
    if (!templateFile) {
      console.warn(`[Calendar] Template file not found: '${templatePath}'`);
      return { contents: "", foldInfo: null };
    }

    const contents = await vault.cachedRead(templateFile);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foldInfo = (window.app as any).foldManager?.load?.(templateFile) ?? null;
    return { contents, foldInfo };
  } catch (err) {
    console.error(
      `[Calendar] Failed to read the periodic note template '${templatePath}'`,
      err
    );
    new Notice("Failed to read the periodic note template");
    return { contents: "", foldInfo: null };
  }
}

const PARAMETERIZED_DATE_TIME_RE =
  /{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi;

const WEEKDAY_TOKEN_RE =
  /{{\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*:(.*?)}}/gi;

const DAYS_OF_WEEK_BASE = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function getDaysOfWeek(): string[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let weekStart = (window.moment.localeData() as any)._week.dow as number;
  const days = DAYS_OF_WEEK_BASE.slice();
  while (weekStart) {
    days.push(days.shift() as string);
    weekStart--;
  }
  return days;
}

function getDayOfWeekNumericalValue(dayOfWeekName: string): number {
  return getDaysOfWeek().indexOf(dayOfWeekName.toLowerCase());
}

export function applyTemplateTokens(
  contents: string,
  periodicity: Periodicity,
  date: Moment,
  format: string
): string {
  const filename = date.format(format);
  let result = contents;

  // Parameterized {{date|time +N unit:fmt}}. With no calc and no momentFormat
  // this also resolves bare {{date}} / {{time}} to date.format(format), so it
  // must run before the plain replacements below would short-circuit it.
  result = result.replace(
    PARAMETERIZED_DATE_TIME_RE,
    (_match, _which, calc, timeDelta, unit, momentFormat) => {
      const now = window.moment();
      const currentDate = date.clone().set({
        hour: now.get("hour"),
        minute: now.get("minute"),
        second: now.get("second"),
      });
      if (calc) {
        currentDate.add(parseInt(timeDelta, 10), unit);
      }
      if (momentFormat) {
        return currentDate.format(momentFormat.substring(1).trim());
      }
      return currentDate.format(format);
    }
  );

  // Plain tokens. These are mostly redundant after the parameterized pass but
  // are kept for clarity and for any token shapes the regex above misses.
  result = result.replace(/{{\s*date\s*}}/gi, filename);
  result = result.replace(/{{\s*time\s*}}/gi, window.moment().format("HH:mm"));
  result = result.replace(/{{\s*title\s*}}/gi, filename);

  if (periodicity === "daily") {
    result = result.replace(
      /{{\s*yesterday\s*}}/gi,
      date.clone().subtract(1, "day").format(format)
    );
    result = result.replace(
      /{{\s*tomorrow\s*}}/gi,
      date.clone().add(1, "day").format(format)
    );
  }

  if (periodicity === "weekly") {
    result = result.replace(
      WEEKDAY_TOKEN_RE,
      (_match, dayOfWeek, momentFormat) => {
        const day = getDayOfWeekNumericalValue(dayOfWeek);
        // Clone before calling `weekday()` — moment's setters mutate.
        return date.clone().weekday(day).format(momentFormat.trim());
      }
    );
  }

  return result;
}

// ---------------------------------------------------------------------------
// Date UID + filename parsing
// ---------------------------------------------------------------------------

export function getDateUID(date: Moment, periodicity: Periodicity): string {
  const unit = PERIODICITY_TO_UNIT[periodicity];
  const ts = date.clone().startOf(unit).format();
  return `${unit}-${ts}`;
}

function removeEscapedCharacters(format: string): string {
  return format.replace(/\[[^\]]*\]/g, "");
}

function isFormatAmbiguous(format: string, periodicity: Periodicity): boolean {
  if (periodicity !== "weekly") return false;
  const cleanFormat = removeEscapedCharacters(format);
  return (
    /w{1,2}/i.test(cleanFormat) &&
    (/M{1,4}/.test(cleanFormat) || /D{1,4}/.test(cleanFormat))
  );
}

/**
 * Parse a date out of a filename for a given periodicity, using the supplied
 * format. Returns null if the format is empty or the filename does not match.
 *
 * Mirrors the week-format ambiguity workaround from
 * obsidian-daily-notes-interface: when a weekly format contains both week and
 * month/day tokens, moment will silently ignore the week tokens, so we re-run
 * the parse with M/D tokens stripped.
 */
export function getDateFromFilename(
  filename: string,
  periodicity: Periodicity,
  format: string
): Moment | null {
  if (!format) return null;

  const effectiveFormat = format.split("/").pop() as string;
  const noteDate = window.moment(filename, effectiveFormat, true);
  if (!noteDate.isValid()) return null;

  if (isFormatAmbiguous(effectiveFormat, periodicity)) {
    const cleanFormat = removeEscapedCharacters(effectiveFormat);
    if (/w{1,2}/i.test(cleanFormat)) {
      return window.moment(
        filename,
        effectiveFormat.replace(/M{1,4}/g, "").replace(/D{1,4}/g, ""),
        false
      );
    }
  }

  return noteDate;
}

export function getDateFromFile(
  file: TFile,
  periodicity: Periodicity,
  format: string
): Moment | null {
  return getDateFromFilename(file.basename, periodicity, format);
}

/**
 * Test whether a path lives inside the configured periodic-note folder.
 * Mirrors the recurseChildren semantics of `getAllPeriodicNotes`: an empty
 * folder or "/" means root (the whole vault); otherwise the path must be a
 * descendant of the configured folder.
 *
 * Accepts a raw vault path string so it can be used both for current files
 * (`file.path`) and for the `oldPath` passed by the vault `rename` event.
 */
export function isPathInConfiguredFolder(
  path: string,
  settings: PeriodicNoteSettings
): boolean {
  const folder = settings.folder?.trim() ?? "";
  if (folder === "" || folder === "/") return true;
  const normalized = normalizePath(folder);
  return path.startsWith(normalized + "/");
}

/**
 * Convenience wrapper for the common "is this TFile inside the folder?" case.
 */
export function isFileInConfiguredFolder(
  file: TFile,
  settings: PeriodicNoteSettings
): boolean {
  return isPathInConfiguredFolder(file.path, settings);
}

// ---------------------------------------------------------------------------
// Vault lookup
// ---------------------------------------------------------------------------

export class PeriodicNotesFolderMissingError extends Error {}

/**
 * Walk the configured folder for a periodicity and return all notes whose
 * basename matches the configured format, keyed by date UID.
 */
export function getAllPeriodicNotes(
  periodicity: Periodicity,
  settings: PeriodicNoteSettings
): Record<string, TFile> {
  const { vault } = window.app;
  const folder = settings.folder?.trim() ?? "";

  // Empty / "/" both mean "scan the entire vault from the root".
  // `vault.getAbstractFileByPath(normalizePath("/"))` is not reliable across
  // Obsidian versions, so use the explicit `vault.getRoot()` for that case.
  let folderObj: TFolder;
  if (folder === "" || folder === "/") {
    folderObj = vault.getRoot();
  } else {
    const found = vault.getAbstractFileByPath(normalizePath(folder));
    if (!found || !(found instanceof TFolder)) {
      throw new PeriodicNotesFolderMissingError(
        `Failed to find ${periodicity} notes folder: '${folder}'`
      );
    }
    folderObj = found;
  }

  const result: Record<string, TFile> = {};
  Vault.recurseChildren(folderObj, (file) => {
    if (file instanceof TFile) {
      const date = getDateFromFile(file, periodicity, settings.format);
      if (date) {
        result[getDateUID(date, periodicity)] = file;
      }
    }
  });
  return result;
}

export function getPeriodicNote(
  date: Moment,
  periodicity: Periodicity,
  allNotes: Record<string, TFile>
): TFile | null {
  return allNotes[getDateUID(date, periodicity)] ?? null;
}
