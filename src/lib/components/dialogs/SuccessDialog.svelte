<script lang="ts">
  import { game } from '../../game.svelte';
  import Button from '../Button.svelte';
  import TreasureChest from '../TreasureChest.svelte';

  interface Props {
    show: boolean;
    onClose: () => void;
    onRetry: () => void;
    onNewMap: () => void;
    onShare: () => void;
  }

  let { show, onClose, onRetry, onNewMap, onShare }: Props = $props();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (show) dialog?.showModal();
    else dialog?.close();
  });

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialog) onClose();
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
  <div class="bg-slate-800 border-2 border-slate-700 rounded-[3rem] shadow-2xl p-10 text-center relative">
    <button onclick={onClose} class="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors text-2xl font-bold">✕</button>
    <div class="w-24 h-24 mx-auto mb-6">
      <TreasureChest open />
    </div>
    <h2 class="text-4xl font-black text-emerald-400 mb-2 italic uppercase tracking-tighter">Treasure Found!</h2>
    <p class="text-slate-400 text-sm mb-10 italic">Your journey across the dictionary is complete.</p>
    
    <div class="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700/50 mb-10">
      <div class="flex justify-between items-center mb-4 border-b border-slate-800 pb-4 px-2">
        <span class="text-xs font-black text-slate-500 uppercase">Total Score</span>
        <span class="text-3xl font-black text-white italic">{game.score}</span>
      </div>
      <div class="flex justify-between items-center px-2">
        <span class="text-xs font-black text-slate-500 uppercase">Total Steps</span>
        <span class="text-xl font-black text-white">{game.history.length - 1}</span>
      </div>
    </div>
    
    <div class="flex flex-col gap-3">
      <Button variant="primary" size="lg" onclick={onShare}>SHARE JOURNEY</Button>
      <div class="grid grid-cols-2 gap-3">
        <Button variant="secondary" onclick={onRetry}>RETRY</Button>
        <Button variant="secondary" onclick={onNewMap}>NEW MAP</Button>
      </div>
    </div>
  </div>
</dialog>
