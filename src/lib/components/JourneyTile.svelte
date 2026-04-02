<script lang="ts">
  import { type ValidationResult } from '../game.svelte';
  import Tooltip from './Tooltip.svelte';

  type Props = {
    word: string;
    type?: string;
    score?: number;
    isStart?: boolean;
    isGoal?: boolean;
    obscurity?: number;
    validation?: ValidationResult;
    flash?: boolean;
    onmouseenter?: () => void;
    onmouseleave?: () => void;
    onclick?: () => void;
  };

  let { word, type, score, isStart, isGoal, obscurity, validation, flash = false, onmouseenter, onmouseleave, onclick }: Props = $props();

  const typeStyles = {
      letter: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
      synonym: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      antonym: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
      anagram: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
      initial: 'text-slate-400 border-slate-700 bg-slate-800/50',
      unknown: 'text-slate-400 border-slate-700 bg-slate-800/50'
  };
</script>

<div class="flex items-center gap-3 w-full group/row">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="flex-1 flex items-center justify-between p-4 h-16 bg-slate-800/40 rounded-2xl border border-slate-700 shadow-xl transition-all box-border relative group/card overflow-visible"
        class:border-l-4={type && type !== 'initial'}
        class:border-l-blue-500={type === 'letter'}
        class:border-l-purple-500={type === 'synonym'}
        class:border-l-orange-500={type === 'antonym'}
        class:border-l-pink-500={type === 'anagram'}
        class:border-emerald-500={isGoal}
        class:cursor-pointer={onclick}
        class:animate-flash={flash}
        {onmouseenter}
        {onmouseleave}
        {onclick}
    >
        <span class="font-mono text-2xl font-black tracking-[0.2em] transition-colors"
              class:text-emerald-400={isGoal}
              class:animate-pulse={isGoal && !flash}
              class:text-white={true}
              class:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]={!isGoal}
        >
            {word}
        </span>

        <div class="flex items-center gap-2">
            {#if type && type !== 'initial'}
                <span class="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border {typeStyles[type as keyof typeof typeStyles] || typeStyles.unknown}">
                    {type === 'letter' ? 'morph' : type}
                </span>
            {/if}

            {#if isStart}
                <div class="w-2.5 h-2.5 rounded-full bg-slate-100 shadow-[0_0_10px_rgba(255,255,255,0.4)]"></div>
            {/if}

            {#if isGoal}
                <div class="w-8 h-8 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
                    <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_15px_#34d399]"></div>
                </div>
            {/if}
        </div>
    </div>

    <!-- Move Score -->
    <div class="w-12 shrink-0 flex flex-col items-center justify-center">
        {#if score !== undefined}
            <Tooltip title="Score Breakdown">
                {#snippet children()}
                    <span class="text-sm font-black text-slate-100 group-hover/row:text-white transition-colors cursor-help">+{score}</span>
                {/snippet}
                {#snippet content()}
                    <div class="space-y-3 min-w-[160px]">
                        <div class="flex justify-between items-center text-[12px]">
                            <span class="text-slate-400 font-bold uppercase tracking-widest">Base Move</span>
                            <span class="font-mono font-black text-white">100</span>
                        </div>
                        <div class="flex justify-between items-center text-[12px] text-emerald-400">
                            <span class="italic font-bold">Rarity Bonus</span>
                            <span class="font-mono font-black">-{100 - score}</span>
                        </div>
                        <div class="flex justify-between items-center font-black mt-4 pt-4 border-t-2 border-slate-800 text-lg">
                            <span class="uppercase tracking-tighter">TOTAL</span>
                            <span class="text-white font-mono">{score}</span>
                        </div>
                    </div>
                {/snippet}
            </Tooltip>
        {/if}
    </div>
</div>

<style>
    @keyframes flash {
        0%, 100% { background-color: rgba(30, 41, 59, 0.4); border-color: #334155; }
        50% { background-color: rgba(239, 68, 68, 0.6); border-color: #ef4444; transform: scale(1.02); }
    }
    .animate-flash {
        animation: flash 0.3s ease-in-out 3;
        z-index: 50;
    }
</style>
