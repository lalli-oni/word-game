import type { ActionType, JourneyStep } from './types';
import type { GameAPI } from './game.svelte';

/**
 * shareResult: copy a formatted journey summary to clipboard.
 * Returns true if the summary included the Magic Wand note (caller can clear suggestedByWand if desired).
 */
export async function shareResult(game: GameAPI): Promise<boolean> {
    const typeEmojis: Record<ActionType, string> = { morph: '🟦', synonym: '🟪', antonym: '🟧', anagram: '🟫' };
    const pathString = game.history.map((m: JourneyStep) => m.type !== 'origin' && m.action ? typeEmojis[m.action] : '⬜').join('');
    let text = `Word Journey: ${game.startWord} ➔ ${game.finishWord}\nScore: ${game.score}\nSteps: ${game.history.length - 1}\nPath: ${pathString}\n\n${window.location.origin}${window.location.pathname}?s=${encodeURIComponent(game.startWord.toLowerCase())}&e=${encodeURIComponent(game.finishWord.toLowerCase())}`;
    const appended = !!game.suggestedByWand;
    if (appended) {
      text += '\n\n(achieved using Magic Wand)';
    }
    if (game.wasModified) {
      text += '\n(Modified via Undo/Reset)';
    }
    try {
      await navigator.clipboard.writeText(text);
      return appended;
    } catch (e) {
      console.warn('[Share] Clipboard write failed', e);
      // fallback: try textarea selection approach for older/locked contexts
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (ex) {
        // final fallback: give up silently (app will still notify user via toast)
        console.warn('[Share] Fallback copy failed', ex);
      }
      return appended;
    }
}