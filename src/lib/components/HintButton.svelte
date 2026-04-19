<script lang="ts">
  import Button from './Button.svelte';
  import { game } from '../game.svelte';

  let { showSolveConfirm }: { showSolveConfirm: (cb: () => void) => void } = $props();

  let busy = $state(false);

  async function onHint() {
    console.log('[Hint] Requesting hint...', { current: game.currentWord, finish: game.finishWord });
    busy = true;
    try {
      const start = game.currentWord;
      const end = game.finishWord;
      const hint = await game.getHint(start, end, { allowProfanity: game.allowProfanity, usedWords: game.history.map(s => s.word) });
      console.log('[Hint] Received hint:', hint);
      
      if (hint) {
        // Pre-fill the input or show suggestion (simple: set a reactive suggestedWord)
        game.suggestedWord = hint.toUpperCase();
        console.log('[Hint] Set game.suggestedWord to:', game.suggestedWord);
        // mark that a suggestion was provided (not the Magic Wand full-solve)
        try { game.suggestedByWand = false; } catch (e) {}
      } else {
        console.warn('[Hint] No hint returned from solver');
        // show simple toast via game state
        game.toastMessage = 'No hint available';
        setTimeout(() => game.toastMessage = '', 2500);
      }
    } catch (err) {
      console.error('[Hint] Error getting hint:', err);
    } finally {
      busy = false;
    }
  }

  function onSolve() {
    console.log('[Solve] Reveal solution requested');
    showSolveConfirm(async () => {
      console.log('[Solve] Solution confirmed, solving...', { current: game.currentWord, finish: game.finishWord });
      busy = true;
      try {
        const start = game.currentWord;
        const end = game.finishWord;
        const solution = await game.getFullSolution(start, end, { allowProfanity: game.allowProfanity, usedWords: game.history.map(s => s.word) });
        console.log('[Solve] Received solution:', solution);
        
        if (solution) {
          game.revealSolution(solution.map(w => w.toUpperCase()));
        } else {
          console.warn('[Solve] No solution found by solver');
          game.toastMessage = 'No solution found';
          setTimeout(() => game.toastMessage = '', 2500);
        }
      } catch (err) {
        console.error('[Solve] Error getting solution:', err);
      } finally {
        busy = false;
      }
    });
  }
</script>

<div class="hint-controls flex gap-2 items-center">
  <Button variant="secondary" size="icon" onclick={onHint} loading={busy} disabled={game.isGenerating || game.isGameOver} tooltip="Get Hint" aria-label="Get hint (Magic Wand)">
    <span class="wand" aria-hidden="true">🪄</span>
  </Button>
  <Button variant="secondary" size="icon" onclick={onSolve} loading={busy} disabled={game.isGenerating || game.isGameOver} tooltip="Reveal Solution" aria-label="Reveal solution">
    <span class="unlock" aria-hidden="true">🔓</span>
  </Button>
</div>

<style>
  .hint-controls { }
  .wand { display:inline-block; transform-origin:center; transition:transform .25s ease; }
  .wand:active { transform: rotate(-12deg) scale(.98); }
</style>