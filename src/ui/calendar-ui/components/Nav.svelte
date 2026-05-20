<script lang="ts">
  import type { Moment } from "src/types/moment";
  import { Platform } from "obsidian";
  import Arrow from "./Arrow.svelte";
  export let displayedMonth: Moment;
  export let today: Moment;
  export let resetDisplayedMonth: () => void;
  export let incrementDisplayedMonth: () => void;
  export let decrementDisplayedMonth: () => void;
  export let quarterVisible: boolean;
  export let onClickMonth: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickYear: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onClickQuarter: (date: Moment, isMetaPressed: boolean) => boolean;
  // Get the word 'Today' but localized to the current language
  const todayDisplayStr = today.calendar().split(/\d|\s/)[0];
  let isMobile = Platform.isMobile;

  // Function to determine the current quarter
  function getCurrentQuarter(month: number): number {
    return Math.floor(month / 3) + 1;
  }
  // Function to get the start of a quarter
  function getStartOfQuarter(year: number, quarter: number): Moment {
    const startMonth = (quarter - 1) * 3; // Calculate the starting month of the quarter
    return displayedMonth.clone().year(year).month(startMonth).startOf("month");
  }
  $: currentQuarter = getCurrentQuarter(displayedMonth.month());
</script>

<div class="nav" class:is-mobile="{isMobile}">
  <div class="title-container">
    <h3 class="title">
      <span
        class="month"
        on:click="{(event) => {
          onClickMonth(displayedMonth, event.metaKey);
        }}">{displayedMonth.format("MMM")}</span
      >
      <span
        class="year"
        on:click="{(event) => {
          onClickYear(displayedMonth, event.metaKey);
        }}">{displayedMonth.format("YYYY")}</span
      >
    </h3>
    {#if quarterVisible}
      <div class="quarters">
        {#each [1, 2, 3, 4] as quarter, index}
          <span
            class="quarter"
            class:active="{quarter === currentQuarter}"
            on:click="{(event) =>
              onClickQuarter(
                getStartOfQuarter(displayedMonth.year(), quarter),
                event.metaKey,
              )}">Q{quarter}</span
          >
          {#if index < 3}
            <span class="divider">•</span>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
  <div class="right-nav">
    <Arrow
      direction="left"
      onClick="{decrementDisplayedMonth}"
      tooltip="Previous Month"
    />
    <div class="reset-button" on:click="{resetDisplayedMonth}">
      {todayDisplayStr}
    </div>
    <Arrow
      direction="right"
      onClick="{incrementDisplayedMonth}"
      tooltip="Next Month"
    />
  </div>
</div>

<style>
  .nav {
    align-items: center;
    display: flex;
    margin: 0.6em 0 1em;
    padding: 0 8px;
    width: 100%;
  }

  .nav.is-mobile {
    padding: 0;
  }

  .title-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .title {
    color: var(--color-text-title);
    font-size: 1.5em;
    margin: 0;
  }

  .is-mobile .title {
    font-size: 1.3em;
  }

  .month {
    font-weight: 500;
    text-transform: capitalize;
    cursor: pointer;
  }

  .year {
    color: var(--interactive-accent);
    cursor: pointer;
  }

  .quarters {
    display: flex;
    align-items: center;
    margin-top: 4px;
    /* 2px optical nudge to the right — sits the cluster just inside the
       month title's left edge instead of perfectly flush, which reads
       better at this font size. Not restoring the old per-item margins
       or container padding (those caused the larger 6px indent). */
    margin-left: 2px;
    /* gap replaces per-item horizontal margins + the container's side
       padding. The previous setup gave Q1 a 4px margin-left plus 2px of
       container padding-left, leaving the row visually indented relative
       to the month title (which has margin: 0). Using gap puts the first
       child flush at the container's left edge while preserving the same
       6px spacing between adjacent items (was 4px quarter-margin + 2px
       divider-margin = 6px between each quarter and its divider). */
    gap: 6px;
  }

  .quarter {
    font-size: 0.6em;
    color: var(--text-muted);
    cursor: pointer;
  }

  .quarter.active {
    color: var(--interactive-accent);
    font-weight: bold;
    /* Background / pill defenses against theme overrides (e.g. Minimal)
       live in styles.css with a `#calendar-container` ID prefix — Svelte's
       component-scoped specificity (0,4,0) isn't enough to beat a theme
       targeting generic `.active` with higher specificity. */
  }

  .divider {
    font-size: 0.4em;
    color: var(--text-muted);
  }

  .right-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: auto;
  }

  .reset-button {
    cursor: pointer;
    border-radius: 4px;
    color: var(--text-muted);
    font-size: 0.7em;
    font-weight: 600;
    letter-spacing: 1px;
    margin: 0 4px;
    padding: 0 4px;
    text-transform: uppercase;
  }

  .reset-button:hover {
    opacity: 0.7;
  }

  .is-mobile .reset-button {
    display: none;
  }
</style>
