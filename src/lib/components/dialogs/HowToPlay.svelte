<script lang="ts">
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
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-black uppercase italic tracking-tighter text-white">How To Play</h2>
      <button onclick={onClose} class="text-slate-500 hover:text-white transition-colors">✕</button>
    </div>

    <div class="space-y-4 text-slate-300 text-sm leading-relaxed">
      <p>
        Journey from the <span class="text-white font-bold">starting word</span> to the
        <span class="text-white font-bold">destination word</span> by entering valid English words
        of the same length.
      </p>
      <p>
        Aim for the <span class="text-white font-bold">lowest score</span> —
        the more common a word is, the more it costs — among other factors.
      </p>
      <p class="text-slate-400 text-xs">
        Stuck? Use the 🪄 magic wand for a hint, or 🔓 to reveal the full solution.
      </p>
    </div>

    <button
      onclick={onClose}
      class="mt-8 w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm uppercase tracking-wider transition-colors"
    >
      Got it
    </button>
  </div>
</dialog>
