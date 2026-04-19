<script lang="ts" generics="T extends 'input' | JourneyStep['type']">
  import type { Snippet } from 'svelte';
  import type { JourneyStep } from '../types';
  import TreasureChest from './TreasureChest.svelte';

  interface Props {
    type: T;
    index?: number;
    isGameOver?: boolean;
    card: Snippet;
    sideInfo?: Snippet;
  }

  let { type, index, isGameOver = false, card, sideInfo }: Props = $props();
</script>

<div class="path-step variant-{type}">
  <div class="spine">
    <div class="track-line" 
         class:is-start={type === 'origin'} 
         class:is-end={type === 'destination'}></div>

    <div class="node-container">
        {#if type === 'origin'}
            <div class="node node-origin"></div>
        {:else if type === 'waypoint'}
            <div class="node node-waypoint">{index}</div>
        {:else if type === 'input'}
            <div class="node node-input">{index}</div>
        {:else if type === 'destination'}
            <div class="node node-destination">
                {#if isGameOver}
                    <div class="goal-pulse"></div>
                {/if}
                <div class="chest-wrapper">
                    <TreasureChest open={isGameOver} />
                </div>
            </div>
        {/if}
    </div>
  </div>

  <div class="card-content">
    {@render card()}
  </div>

  <div class="side-info">
    {#if sideInfo}
        {@render sideInfo()}
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference "../../app.css";

  .path-step {
    @apply flex items-center gap-2 relative py-3 w-full;
  }

  .spine {
    @apply w-16 flex flex-col items-center justify-center shrink-0 relative self-stretch;
  }

  .track-line {
    @apply absolute left-[31px] top-0 bottom-0 w-0.5 bg-slate-700/50;
  }

  .track-line.is-start { @apply top-1/2; }
  .track-line.is-end { @apply bottom-1/2; }

  .node-container {
    @apply relative z-10 bg-transparent py-2 flex items-center justify-center w-full;
  }

  .node {
    @apply flex items-center justify-center transition-all duration-500;
  }

  .node-origin {
    @apply w-5 h-5 rounded-full bg-slate-400/80 shadow-[0_0_15px_rgba(148,163,184,0.4)] border-2 border-slate-300/20;
  }

  .node-waypoint, .node-input {
    @apply text-[10px] font-black text-slate-500 bg-slate-900 w-7 h-7 rounded-full border border-slate-700 border-dashed;
  }

  .node-destination {
    @apply w-8 h-8 relative flex items-center justify-center;
  }

  .chest-wrapper {
    @apply w-full h-full flex items-center justify-center scale-110;
  }

  .goal-pulse {
    @apply absolute inset-0 bg-emerald-400/20 blur-md rounded-full animate-pulse scale-150;
  }

  .card-content {
    @apply flex-1 min-w-0;
  }

  .side-info {
    @apply w-12 flex items-center justify-end pr-2 text-slate-500 font-black font-mono text-sm;
  }
</style>
