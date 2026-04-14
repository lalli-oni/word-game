<script lang="ts">
  import Button from '../Button.svelte';

  interface Props {
    show: boolean;
    title: string;
    body: string;
    actionLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { show, title, body, actionLabel, cancelLabel, onConfirm, onCancel }: Props = $props();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (show) dialog?.showModal();
    else dialog?.close();
  });

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialog) onCancel();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog 
  bind:this={dialog} 
  onclick={handleBackdropClick}
  onclose={onCancel}
  class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-sm outline-none"
>
  <div class="bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl p-8 text-center">
    <h2 class="text-xl font-black uppercase italic tracking-tighter text-white mb-2">{title}</h2>
    <p class="text-slate-400 text-sm mb-8">{body}</p>
    <div class="flex flex-col gap-2">
      <Button variant="danger" onclick={onConfirm}>{actionLabel}</Button>
      <Button variant="secondary" onclick={onCancel}>{cancelLabel}</Button>
    </div>
  </div>
</dialog>
