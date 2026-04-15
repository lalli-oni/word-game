import type { GameEngine } from "./game.svelte";

export function shareResult(game: GameEngine) {
		const typeEmojis = { morph: '🟦', synonym: '🟪', antonym: '🟧', anagram: '🟫' };
		const pathString = game.history.map(m => m.type !== 'origin' && m.action ? typeEmojis[m.action] : '⬜').join('');
		const text = `Word Journey: ${game.startWord} ➔ ${game.finishWord}\nScore: ${game.score}\nSteps: ${game.history.length - 1}\nPath: ${pathString}\n\n${window.location.origin}${window.location.pathname}?s=${game.startWord.toLowerCase()}&e=${game.finishWord.toLowerCase()}`;
		navigator.clipboard.writeText(text);
}