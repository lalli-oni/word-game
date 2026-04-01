<script lang="ts">
  import { type Move, type ValidationResult, game } from '../game.svelte';

  type Props = {
    word: string;
    type?: string;
    score?: number;
    isStart?: boolean;
    isGoal?: boolean;
    obscurity?: number;
    validation?: ValidationResult;
    onmouseenter?: () => void;
    onmouseleave?: () => void;
  };

  let { word, type, score, isStart, isGoal, obscurity, validation, onmouseenter, onmouseleave }: Props = $props();

  const getObscurityLabel = (val: number) => {
      if (val <= 1) return 'Common';
      if (val <= 3) return 'Typical';
      if (val <= 6) return 'Rare';
      return 'Obscure';
  };

  const getObscurityColor = (val: number) => {
      if (val <= 1) return 'text-emerald-400';
      if (val <= 3) return 'text-blue-400';
      if (val <= 6) return 'text-purple-400';
      return 'text-pink-400';
  };
</script>

<div 
    class="flex-1 flex items-center justify-between p-4 h-16 bg-slate-800/40 rounded-2xl border border-slate-700 shadow-xl transition-all w-full box-border relative group/card"
    class:border-l-4={type && type !== 'initial'}
    class:border-l-blue-500={type === 'letter'}
    class:border-l-purple-500={type === 'synonym'}
    class:border-l-orange-500={type === 'antonym'}
    class:border-l-pink-500={type === 'anagram'}
    class:border-emerald-500={isGoal}
    {onmouseenter}
    {onmouseleave}
>
    <span class="font-mono text-2xl font-black tracking-[0.2em] {isGoal ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} group-hover/card:text-white transition-colors">
        {word}
    </span>

    <div class="flex items-center gap-3">
        {#if score !== undefined}
            <div class="group/score relative cursor-help">
                <span class="text-[10px] font-black text-slate-500">+{score}</span>
                <!-- Score Breakdown Tooltip -->
                <div class="invisible group-hover/score:visible absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-950 text-white rounded-xl shadow-2xl z-50 text-[10px] leading-relaxed animate-in fade-in zoom-in duration-100 border border-slate-800">
                    <p class="font-black uppercase tracking-widest text-slate-500 mb-1">Score Breakdown</p>
                    <div class="flex justify-between border-b border-slate-800 pb-1 mb-1">
                        <span>Base Cost</span>
                        <span>100</span>
                    </div>
                    <div class="flex justify-between text-emerald-400">
                        <span>Rarity Discount</span>
                        <span>-{100 - score}</span>
                    </div>
                    <div class="flex justify-between font-bold mt-1 pt-1 border-t border-slate-800">
                        <span>Total</span>
                        <span>{score}</span>
                    </div>
                    <div class="absolute top-full right-4 border-4 border-transparent border-t-slate-950"></div>
                </div>
            </div>
        {/if}

        {#if type && type !== 'initial'}
            <span class="text-[8px] font-black uppercase tracking-tighter text-slate-500 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700/50">
                {type === 'letter' ? 'morph' : type}
            </span>
        {/if}

        {#if isStart}
            <div class="w-2 h-2 rounded-full bg-slate-600"></div>
        {/if}

        {#if isGoal}
            <div class="w-8 h-8 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
        {/if}
    </div>
</div>
