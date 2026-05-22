<svelte:options immutable />

<script lang="ts">
  import { Platform } from "obsidian";

  import { moment } from "src/types/moment";
  import type { Locale, Moment } from "src/types/moment";

  import Day from "./Day.svelte";
  import Nav from "./Nav.svelte";
  import WeekNum from "./WeekNum.svelte";
  import { getDailyMetadata, getWeeklyMetadata } from "../metadata";
  import type { ICalendarSource, IMonth } from "../types";
  import { getDaysOfWeek, getMonth, isWeekend } from "../utils";

  // Localization
  export let localeData: Locale;

  // Settings
  export let showWeekNums: boolean = false;
  export let showWeekNumsRight: boolean = false;
  // JS weekday numbers (0 = Sunday … 6 = Saturday) treated as weekend days
  // for the `class:weekend` binding on header and body cells. Independent of
  // week-start ordering.
  export let weekendDays: number[] = [0, 6];

  // Event Handlers
  export let onHoverDay: (
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean,
  ) => boolean;
  export let onHoverWeek: (
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean,
  ) => boolean;
  export let onContextMenuDay: (date: Moment, event: MouseEvent) => boolean;
  export let onContextMenuWeek: (date: Moment, event: MouseEvent) => boolean;
  export let quarterVisible: boolean;
  export let onClickDay: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickWeek: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickMonth: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickYear: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickQuarter: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickToday: ((date: Moment) => void) | undefined = undefined;
  // External sources (All optional)
  export let sources: ICalendarSource[] = [];
  export let selectedId: string;

  // Override-able local state
  export let today: Moment = moment();
  export let displayedMonth = today;

  let month: IMonth;
  let daysOfWeek: string[];

  let isMobile = Platform.isMobile;

  $: month = getMonth(displayedMonth, localeData);
  $: daysOfWeek = getDaysOfWeek(today, localeData);

  // Exports
  export function incrementDisplayedMonth() {
    displayedMonth = displayedMonth.clone().add(1, "month");
  }

  export function decrementDisplayedMonth() {
    displayedMonth = displayedMonth.clone().subtract(1, "month");
  }

  export function resetDisplayedMonth() {
    displayedMonth = today.clone();
  }
</script>

<div id="calendar-container" class="container" class:is-mobile="{isMobile}">
  <Nav
    {today}
    {displayedMonth}
    {incrementDisplayedMonth}
    {decrementDisplayedMonth}
    {quarterVisible}
    {onClickMonth}
    {onClickYear}
    {onClickQuarter}
    {onClickToday}
    {resetDisplayedMonth}
  />
  <table class="calendar">
    <colgroup>
      {#if showWeekNums && !showWeekNumsRight}
        <col />
      {/if}
      {#each month[1].days as _date}
        <col />
      {/each}
    </colgroup>
    <thead>
      <tr>
        {#if showWeekNums && !showWeekNumsRight}
          <th class="week-num-heading">W</th>
        {/if}
        {#each daysOfWeek as dayOfWeek, i}
          <th class:weekend="{isWeekend(month[1].days[i], weekendDays)}">{dayOfWeek}</th>
        {/each}
        {#if showWeekNums && showWeekNumsRight}
          <th class="week-num-heading">W</th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each month as week (week.weekNum)}
        <tr>
          {#if showWeekNums && !showWeekNumsRight}
            <WeekNum
              {...week}
              metadata="{getWeeklyMetadata(sources, week.days[0], today)}"
              onClick="{onClickWeek}"
              onContextMenu="{onContextMenuWeek}"
              onHover="{onHoverWeek}"
              {selectedId}
              gridRight="{!showWeekNumsRight}"
            />
          {/if}
          {#each week.days as day (day.format())}
            <Day
              date="{day}"
              {today}
              {displayedMonth}
              {weekendDays}
              onClick="{onClickDay}"
              onContextMenu="{onContextMenuDay}"
              onHover="{onHoverDay}"
              metadata="{getDailyMetadata(sources, day, today)}"
              {selectedId}
            />
          {/each}
          {#if showWeekNums && showWeekNumsRight}
            <WeekNum
              {...week}
              metadata="{getWeeklyMetadata(sources, week.days[0], today)}"
              onClick="{onClickWeek}"
              onContextMenu="{onContextMenuWeek}"
              onHover="{onHoverWeek}"
              {selectedId}
              gridRight="{!showWeekNumsRight}"
            />
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .container {
    --color-background-heading: transparent;
    --color-background-day: transparent;
    --color-background-weeknum: transparent;
    --color-background-weekend: var(--color-base-25);

    --color-dot: var(--text-muted);
    --color-arrow: var(--text-muted);
    --color-button: var(--text-muted);

    --color-text-title: var(--text-normal);
    --color-text-heading: var(--text-muted);
    --color-text-day: var(--text-normal);
    --color-text-today: var(--interactive-accent);
    --color-text-weeknum: var(--text-muted);
  }

  .container {
    padding: 0 8px;
    user-select: none;
  }

  .container.is-mobile {
    padding: 0;
  }

  th {
    text-align: center;
  }

  .calendar {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
  }

  .week-num-heading {
    width: 10%;
  }

  th {
    background-color: var(--color-background-heading);
    color: var(--color-text-heading);
    font-size: 0.6em;
    letter-spacing: 1px;
    padding: 4px;
    text-transform: uppercase;
  }
</style>
