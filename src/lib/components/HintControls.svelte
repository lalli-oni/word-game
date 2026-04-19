<script lang="ts">
  import { game } from '../game.svelte';
  import Button from './Button.svelte';
  import ButtonGroup from './ButtonGroup.svelte';

  let busy = $state(false);
  let dialog: HTMLDialogElement;
  let pendingAction: (() => Promise<void>) | null = null;
  let dialogConfig = $state({ title: '', body: '', confirmLabel: '' });

  function showConfirm(title: string, body: string, confirmLabel: string, action: () => Promise<void>) {
    dialogConfig = { title, body, confirmLabel };
    pendingAction = action;
    dialog.showModal();
  }

  async function handleConfirm() {
    dialog.close();
    if (!pendingAction) return;
    busy = true;
    try { await pendingAction(); } finally { busy = false; pendingAction = null; }
  }

  function handleCancel() {
    dialog.close();
    pendingAction = null;
  }

  function onHint() {
    showConfirm(
      'Need a hint?',
      'The crystal ball will reveal the next word on the optimal path.',
      'Reveal hint',
      async () => {
        const hint = await game.getHint(game.currentWord, game.finishWord, {
          allowProfanity: game.allowProfanity,
          usedWords: game.history.map(s => s.word)
        });
        if (hint) {
          game.suggestedWord = hint.toUpperCase();
        } else {
          game.toastMessage = 'No hint available';
          setTimeout(() => game.toastMessage = '', 2500);
        }
      }
    );
  }

  function onSolve() {
    showConfirm(
      'Reveal full solution?',
      'The magic wand will complete the rest of the journey for you. This cannot be undone.',
      'Reveal solution',
      async () => {
        const solution = await game.getFullSolution(game.currentWord, game.finishWord, {
          allowProfanity: game.allowProfanity,
          usedWords: game.history.map(s => s.word)
        });
        if (solution) {
          game.revealSolution(solution.map(w => w.toUpperCase()));
        } else {
          game.toastMessage = 'No solution found';
          setTimeout(() => game.toastMessage = '', 2500);
        }
      }
    );
  }
</script>

<ButtonGroup>
  <Button
    variant="secondary"
    size="icon"
    onclick={onHint}
    loading={busy}
    disabled={game.isGenerating || game.isGameOver}
    tooltip="Get Hint"
    aria-label="Get hint (Crystal Ball)"
  >
    🔮
  </Button>
  <Button
    variant="secondary"
    size="icon"
    onclick={onSolve}
    loading={busy}
    disabled={game.isGenerating || game.isGameOver}
    tooltip="Reveal Solution"
    aria-label="Reveal full solution (Magic Wand)"
  >
    🪄
  </Button>
</ButtonGroup>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  onclose={handleCancel}
  class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-sm outline-none"
>
  <div class="bg-slate-800 border-2 border-slate-700 rounded-4xl shadow-2xl p-8">
    <h2 class="text-lg font-black uppercase italic tracking-tighter text-white mb-3">{dialogConfig.title}</h2>
    <p class="text-slate-300 text-sm leading-relaxed mb-6">{dialogConfig.body}</p>
    <div class="flex gap-3">
      <button
        onclick={handleCancel}
        class="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm uppercase tracking-wider transition-colors"
      >
        Cancel
      </button>
      <button
        onclick={handleConfirm}
        class="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wider transition-colors"
      >
        {dialogConfig.confirmLabel}
      </button>
    </div>
  </div>
</dialog>
