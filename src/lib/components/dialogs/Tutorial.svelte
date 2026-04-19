<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let open = false;
  const dispatch = createEventDispatcher();

  let step = 0;
  const steps = [
    'Welcome! This short tutorial shows how to play.',
    'Make a move by typing a word and submitting.',
    'Use the Magic Wand for hints. Hints are fast and safe.',
    'Try changing one letter (morph) or re-arranging letters (anagram).',
  ];

  function next() {
    if (step < steps.length - 1) step += 1;
    else finish();
  }
  function prev() { if (step > 0) step -= 1; }
  function finish() { open = false; dispatch('close'); }
</script>

{#if open}
  <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Tutorial">
    <div class="modal-content">
      <h2>Tutorial</h2>
      <p>{steps[step]}</p>
      <div class="controls">
        <button on:click={prev} disabled={step===0}>Previous</button>
        <button on:click={next}>{step === steps.length - 1 ? 'Finish' : 'Next'}</button>
      </div>
      <button class="close" on:click={finish} aria-label="Close tutorial">×</button>
    </div>
  </div>
{/if}

<style>
.modal-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4)}
.modal-content{background:white;padding:1rem;border-radius:8px;max-width:600px;width:90%}
.controls{display:flex;gap:8px;margin-top:12px}
.close{position:absolute;right:12px;top:12px}
</style>