<script lang="ts">
  import Button from './Button.svelte';
  import { game } from '../game.svelte';

  export let showSolveConfirm: (cb: () => void) => void;

  let busy = $state(false);

  async function onHint() {
    busy = true;
    try {
      const start = game.currentWord;
      const end = game.finishWord;
      const hint = await game.getHint(start, end, { allowProfanity: game.allowProfanity, usedWords: game.history.map(s => s.word) });
      if (hint) {
        // Pre-fill the input or show suggestion (simple: set a reactive suggestedWord)
        game.suggestedWord = hint.toUpperCase();
      } else {
        // show simple toast via game state
        game.toastMessage = 'No hint available';
        setTimeout(() => game.toastMessage = '', 2500);
      }
    } finally {
      busy = false;
    }
  }

  function onSolve() {
    showSolveConfirm(async () => {
      busy = true;
      try {
        const start = game.currentWord;
        const end = game.finishWord;
        const solution = await game.getFullSolution(start, end, { allowProfanity: game.allowProfanity, usedWords: game.history.map(s => s.word) });
        if (solution) {
          game.revealSolution(solution.map(w => w.toUpperCase()));
        } else {
          game.toastMessage = 'No solution found';
          setTimeout(() => game.toastMessage = '', 2500);
        }
      } finally {
        busy = false;
      }
    });
  }
</script>

<div class="hint-controls flex gap-2 items-center">
  <Button variant="secondary" size="icon" onclick={onHint} loading={busy} disabled={game.isGenerating || game.isGameOver}>🫵</Button>
  <Button variant="secondary" size="icon" onclick={onSolve} loading={busy} disabled={game.isGenerating || game.isGameOver}>🔓</Button>
</div>

<style>
  .hint-controls { }
</style>