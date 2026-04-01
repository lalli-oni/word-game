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
    class="flex-1 flex items-center justify-between p-4 h-16 bg-slate-800/40 rounded-2xl border border-slate-700 shadow-xl transition-all w-full box-border relative group/card overflow-visible"
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
            <div class="group/score relative cursor-help flex flex-col items-end">
                <span class="text-[10px] font-black text-slate-500">+{score}</span>
                <!-- Score Breakdown Tooltip -->
                <div class="invisible group-hover/score:visible absolute bottom-full right-0 mb-3 w-48 p-4 bg-slate-950 text-white rounded-[1.5rem] shadow-2xl z-[100] text-[10px] leading-relaxed animate-in fade-in zoom-in duration-100 border border-slate-800 pointer-events-none">
                    <p class="font-black uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-800 pb-1">Score Breakdown</p>
                    <div class="space-y-1">
                        <div class="flex justify-between">
                            <span class="text-slate-400">Base Move</span>
                            <span class="font-mono">100</span>
                        </div>
                        <div class="flex justify-between text-emerald-400">
                            <span class="italic">Rarity Bonus</span>
                            <span class="font-mono">-{100 - score}</span>
                        </div>
                        <div class="flex justify-between font-black mt-2 pt-2 border-t border-slate-800 text-sm">
                            <span>TOTAL</span>
                            <span class="text-white font-mono">{score}</span>
                        </div>
                    </div>
                    <div class="absolute top-full right-4 border-8 border-transparent border-t-slate-950"></div>
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
