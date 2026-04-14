<script lang="ts">
  import { game } from '../../game.svelte';
  import { journeys } from '../../journeys';

  interface Props {
    show: boolean;
    onClose: () => void;
    onSelect: (journey: any) => void;
  }

  let { show, onClose, onSelect }: Props = $props();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (show) dialog?.showModal();
    else dialog?.close();
  });

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialog) onClose();
  }

  const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
  
  let filteredJourneys = $derived(
      journeys
        .filter(j => game.allowProfanity || !j.tags?.includes('profanity'))
        .sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
  );

  function getDifficultyClasses(diff: string) {
      const base = "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border";
      if (diff === 'easy') return `${base} text-emerald-400 border-emerald-500/30 bg-emerald-500/10`;
      if (diff === 'medium') return `${base} text-yellow-400 border-yellow-500/30 bg-yellow-500/10`;
      if (diff === 'hard') return `${base} text-red-400 border-red-500/30 bg-red-500/10`;
      return base;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog 
  bind:this={dialog} 
  onclick={handleBackdropClick}
  onclose={onClose}
  class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-lg outline-none"
>
  <div class="bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
    <div class="p-6 border-b-2 border-slate-700 flex justify-between items-center bg-slate-800/50">
      <h2 class="text-xl font-black uppercase italic tracking-tighter text-white">Choose journey</h2>
      <button onclick={onClose} class="text-slate-500 hover:text-white transition-colors">✕</button>
    </div>
    <div class="overflow-y-auto p-4 flex flex-col gap-2 text-left custom-scrollbar">
      {#each filteredJourneys as s}
        {@const result = game.completedJourneys[s.id]}
        <button 
          onclick={() => onSelect(s)} 
          class="w-full text-left p-5 bg-slate-900/30 hover:bg-slate-700 border-2 border-slate-700/50 rounded-2xl transition-all group relative"
        >
          <div class="flex justify-between items-center mb-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{s.name}</span>
              {#if result}<span class="text-[10px]" title="Completed!">✅</span>{/if}
            </div>
            <span class={getDifficultyClasses(s.difficulty)}>{s.difficulty}</span>
          </div>
          <div class="flex justify-between items-end">
            <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{s.startWord} ➔ {s.finishWord}</p>
            {#if result}<span class="text-[9px] font-black text-emerald-500 uppercase">Best: {result.score} 🏆</span>{/if}
          </div>
        </button>
      {/each}
    </div>
  </div>
</dialog>

<style>
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
</style>
