<svelte:options immutable />

<script lang="ts">
  import type { Moment } from "moment";
  import { getDateUID } from "src/io/periodicNoteHelpers";

  import Dot from "./Dot.svelte";
  import MetadataResolver from "./MetadataResolver.svelte";
  import type { IDayMetadata } from "../types";
  import { getStartOfWeek, isMetaPressed } from "../utils";

  // Properties
  export let weekNum: number;
  export let days: Moment[];
  export let metadata: Promise<IDayMetadata> | null;
  export let gridRight: boolean;

  // Event handlers
  export let onHover: (
    date: Moment,
    targetEl: EventTarget,
    isMetaPressed: boolean,
  ) => boolean;
  export let onClick: (date: Moment, isMetaPressed: boolean) => boolean;
  export let onContextMenu: (date: Moment, event: MouseEvent) => boolean;

  // Global state;
  export let selectedId: string = null;

  let startOfWeek: Moment;
  $: startOfWeek = getStartOfWeek(days);
</script>

<td class:grid-right={gridRight}>
  <MetadataResolver {metadata} let:metadata>
    <div
      class="{`week-num ${metadata.classes.join(' ')}`}"
      class:active="{selectedId === getDateUID(days[0], 'weekly')}"
      on:click="{onClick && ((e) => onClick(startOfWeek, isMetaPressed(e)))}"
      on:contextmenu="{onContextMenu && ((e) => onContextMenu(days[0], e))}"
      on:pointerover="{onHover &&
        ((e) => onHover(startOfWeek, e.target, isMetaPressed(e)))}"
    >
      {weekNum}
      <div class="dot-container">
        {#each metadata.dots as dot}
          <Dot {...dot} />
        {/each}
      </div>
    </div>
  </MetadataResolver>
</td>

<style>
  td.grid-right {
    border-right: 1px solid var(--background-modifier-border);
  }

  .week-num {
    background-color: var(--color-background-weeknum);
    border-radius: 4px;
    color: var(--color-text-weeknum);
    cursor: pointer;
    font-size: 0.8em;
    height: 100%;
    padding: 4px;
    text-align: center;
    transition:
      background-color 0.1s ease-in,
      color 0.1s ease-in;
    vertical-align: baseline;
  }

  .week-num:hover {
    background-color: var(--interactive-hover);
  }

  .week-num.active {
    color: var(--text-on-accent);
    background-color: var(--interactive-accent);
  }

  .week-num.active:hover {
    background-color: var(--interactive-accent-hover);
  }

  /* Reserve consistent space so week numbers don't shift vertically when a
     weekly-note dot appears or disappears. */
  .dot-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    min-height: 6px;
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
