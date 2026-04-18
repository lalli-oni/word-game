export function shareResult(game: any) {
    const typeEmojis = { morph: '🟦', synonym: '🟪', antonym: '🟧', anagram: '🟫' };
    const pathString = game.history.map(m => m.type !== 'origin' && m.action ? typeEmojis[m.action] : '⬜').join('');
    let text = `Word Journey: ${game.startWord} ➔ ${game.finishWord}\nScore: ${game.score}\nSteps: ${game.history.length - 1}\nPath: ${pathString}\n\n${window.location.origin}${window.location.pathname}?s=${game.startWord.toLowerCase()}&e=${game.finishWord.toLowerCase()}`;
    if (game.suggestedByWand) {
      text += '\n\n(achieved using Magic Wand)';
      try { game.suggestedByWand = false; } catch (e) { }
    }
    navigator.clipboard.writeText(text);
}