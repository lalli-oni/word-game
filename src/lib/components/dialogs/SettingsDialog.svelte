<script lang="ts">
  import { game } from '../../game.svelte';

  interface Props {
    show: boolean;
    onClose: () => void;
  }

  let { show, onClose }: Props = $props();
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
  class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-md outline-none"
>
  <div class="bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl p-8">
    <div class="flex justify-between items-center mb-8">
      <h2 class="text-xl font-black uppercase italic tracking-tighter text-white">Settings</h2>
      <button onclick={onClose} class="text-slate-500 hover:text-white transition-colors">✕</button>
    </div>
    
    <div class="space-y-6">
      <label class="flex items-center justify-between cursor-pointer group">
        <span class="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Untamed Vocabulary (Profanity)</span>
        <div class="relative inline-flex items-center">
          <input type="checkbox" bind:checked={game.allowProfanity} class="sr-only peer">
          <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </div>
      </label>


    </div>
  </div>
</dialog>
