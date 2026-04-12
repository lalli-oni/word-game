<script lang="ts">
  import type { Move } from '../game.svelte';
  import Tooltip from './Tooltip.svelte';
  import TreasureChest from './TreasureChest.svelte';

  type WordType = 'origin' | 'history' | 'input' | 'destination';

  type Props = {
    // Snippets for flexible content
    card?: import('svelte').Snippet;
    class?: string;
    type: WordType;
    // When type === 'history' | 'input'. 
    // TODO (LTJ): use discrimated union to enforce this
    historyIndex?: number;
    // When type === 'destination'
    // TODO (LTJ): use discrimated union to enforce this
    gameOver?: boolean;
    move?: Move; 
  };

  let {
    card,
    class: className = '',
    type,
    historyIndex,
    gameOver,
    move
  }: Props = $props();
</script>

<div class="flex items-center gap-3 w-full group/row {className}">
    <!-- 1. LEFT INDICATOR (SPINE) -->
    <div class="w-12 h-16 shrink-0 flex items-center justify-center relative">
      {#if type === 'origin'}
        <div class="w-6 h-6 rounded-full bg-slate-400 shadow-[0_0_10px_rgba(255,255,255,0.4)]"></div>
      {:else if type === 'history'}
        <div class="w-6 h-6 text-[10px] font-black text-slate-400 flex items-center justify-center bg-slate-800 rounded-full border border-slate-700 shadow-lg">{(historyIndex || 0) + 1}</div>
      {:else if type === 'input'}
        <div class="w-6 h-6 text-[10px] font-black text-slate-600 flex items-center justify-center rounded-full border border-slate-700 border-dashed">{historyIndex}</div>
      {:else if type === 'destination'}
        <div class="w-6 h-6 relative flex items-center justify-center">
          {#if gameOver}
              <div class="absolute w-8 h-8 bg-emerald-400/20 blur-md rounded-full animate-pulse"></div>
          {/if}
          <div class="relative z-10">
              <TreasureChest open={gameOver} />
          </div>
        </div>
      {/if}
    </div>

    <!-- 2. CENTER CONTENT (CARD) -->
    <div class="flex-1 min-w-0">
        {#if card}
            {@render card()}
        {/if}
    </div>

    <!-- 3. RIGHT CONTENT (SCORE) -->
    <div class="w-12 shrink-0 flex items-center justify-center h-16">
        {#if type === 'origin'}
          <span class="text-sm font-black text-slate-400">0</span>
        {:else if type === 'history' && move}
          <Tooltip title="Score Breakdown">
            {#snippet children()}<span class="text-sm font-black text-slate-100 group-hover/row:text-white transition-colors cursor-help">+{move.moveScore}</span>{/snippet}
            {#snippet content()}
              <div class="space-y-3 min-w-40">
                <div class="flex justify-between items-center text-[12px]">
                  <span class="text-slate-400 font-bold uppercase tracking-widest">Base Move</span>
                  <span class="font-mono font-black text-white">100</span>
                </div>
                <div class="flex justify-between items-center text-[12px] text-emerald-400">
                  <span class="italic font-bold">Rarity Bonus</span>
                  <span class="font-mono font-black">-{100 - (move.moveScore || 0)}</span>
                </div>
                <div class="flex justify-between items-center font-black mt-4 pt-4 border-t-2 border-slate-800 text-lg">
                  <span class="uppercase tracking-tighter">TOTAL</span>
                  <span class="text-white font-mono">{move.moveScore}</span>
                </div>
              </div>
            {/snippet}
          </Tooltip>
          <!-- NOTE (LTJ): Left in for prosperity. Should give final score. -->
        <!-- {:else if type === 'destination'}
          {#if gameOver}
              {@const last = game.history[game.history.length - 1]}
              <Tooltip title="Score Breakdown">
                {#snippet children()}<span class="text-sm font-black text-slate-100 group-hover/row:text-white transition-colors cursor-help">+{last.moveScore}</span>{/snippet}
                {#snippet content()}
                  <div class="space-y-3 min-w-[160px]">
                    <div class="flex justify-between items-center text-[12px]">
                      <span class="text-slate-400 font-bold uppercase tracking-widest">Base Move</span>
                      <span class="font-mono font-black text-white">100</span>
                    </div>
                    <div class="flex justify-between items-center text-[12px] text-emerald-400">
                      <span class="italic font-bold">Rarity Bonus</span>
                      <span class="font-mono font-black">-{100 - (last.moveScore || 0)}</span>
                    </div>
                    <div class="flex justify-between items-center font-black mt-4 pt-4 border-t-2 border-slate-800 text-lg">
                      <span class="uppercase tracking-tighter">TOTAL</span>
                      <span class="text-white font-mono">{last.moveScore}</span>
                    </div>
                  </div>
                {/snippet}
              </Tooltip>
          {/if} -->
        {/if}
    </div>
</div>
