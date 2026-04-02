<script lang="ts">
  import TreasureChest from './TreasureChest.svelte';
  import Tooltip from './Tooltip.svelte';

  type RowType = 'origin' | 'waypoint' | 'input' | 'destination';

  type Props = {
    type: RowType;
    word?: string;
    stepNumber?: number;
    score?: number;
    connectionType?: string;
    isGameOver?: boolean;
    flash?: boolean;
    // Snippets for flexible content
    card?: import('svelte').Snippet;
    side?: import('svelte').Snippet;
  };

  let { 
    type, 
    word, 
    stepNumber, 
    score, 
    connectionType, 
    isGameOver = false, 
    flash = false,
    card,
    side
  }: Props = $props();

  const spineBase = "w-12 shrink-0 flex items-center justify-center h-16 relative";
</script>

<div class="flex items-center gap-3 w-full group/row">
    <!-- 1. LEFT INDICATOR (SPINE) -->
    <div class={spineBase}>
        {#if type === 'origin'}
            <div class="w-2.5 h-2.5 rounded-full bg-slate-100 shadow-[0_0_10px_rgba(255,255,255,0.4)]"></div>
        {:else if type === 'waypoint'}
            <div class="text-[10px] font-black text-slate-400 bg-slate-800 w-6 h-6 flex items-center justify-center rounded-full border border-slate-700 shadow-lg">
                {stepNumber}
            </div>
        {:else if type === 'input'}
            <div class="text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border border-slate-700 border-dashed text-slate-600">
                {stepNumber}
            </div>
        {:else if type === 'destination'}
            <div class="w-6 h-6">
                <TreasureChest open={isGameOver} />
            </div>
        {/if}
    </div>

    <!-- 2. CENTER CONTENT (CARD) -->
    <div class="flex-1 min-w-0">
        {#if card}
            {@render card()}
        {/if}
    </div>

    <!-- 3. RIGHT CONTENT (SCORE/SIDE) -->
    <div class="w-12 shrink-0 flex items-center justify-center h-16">
        {#if side}
            {@render side()}
        {:else if score !== undefined}
            <span class="text-sm font-black text-slate-100 group-hover/row:text-white transition-colors">+{score}</span>
        {/if}
    </div>
</div>
