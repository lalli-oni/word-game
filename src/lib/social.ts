export async function shareResult(game: any): Promise<boolean> {
    const typeEmojis = { morph: '🟦', synonym: '🟪', antonym: '🟧', anagram: '🟫' };
    const pathString = game.history.map(m => m.type !== 'origin' && m.action ? typeEmojis[m.action] : '⬜').join('');
    let text = `Word Journey: ${game.startWord} ➔ ${game.finishWord}\nScore: ${game.score}\nSteps: ${game.history.length - 1}\nPath: ${pathString}\n\n${window.location.origin}${window.location.pathname}?s=${game.startWord.toLowerCase()}&e=${game.finishWord.toLowerCase()}`;
    const appended = !!game.suggestedByWand;
    if (appended) {
      text += '\n\n(achieved using Magic Wand)';
    }
    try {
      await navigator.clipboard.writeText(text);
      return appended;
    } catch (e) {
      console.warn('[Share] Clipboard write failed', e);
      // fallback: no-op (could implement textarea selection fallback)
      return appended;
    }
}