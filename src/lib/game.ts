import { writable } from 'svelte/store';
import { type Scenario } from './scenarios';

export type ConnectionType = 'initial' | 'letter' | 'synonym' | 'antonym' | 'anagram' | 'unknown';

export interface Move {
  word: string;
  type: ConnectionType;
  previousWord?: string;
  timestamp: number;
}

export interface GameState {
  startWord: string;
  finishWord: string;
  currentWord: string;
  history: Move[];
  isGameOver: boolean;
  score: number;
}

const initialState: GameState = {
  startWord: 'COLD',
  finishWord: 'WARM',
  currentWord: 'COLD',
  history: [{ word: 'COLD', type: 'initial', timestamp: Date.now() }],
  isGameOver: false,
  score: 0
};

function createGame() {
  const store = writable<GameState>(initialState);
  const { subscribe, set, update } = store;

  return {
    subscribe,
    loadScenario: (scenario: Scenario) => {
      set({
        startWord: scenario.startWord.toUpperCase(),
        finishWord: scenario.finishWord.toUpperCase(),
        currentWord: scenario.startWord.toUpperCase(),
        history: [{ word: scenario.startWord.toUpperCase(), type: 'initial', timestamp: Date.now() }],
        isGameOver: false,
        score: 0
      });
    },
    reset: () => {
      update(state => ({
        ...state,
        currentWord: state.startWord,
        history: [{ word: state.startWord, type: 'initial', timestamp: Date.now() }],
        isGameOver: false,
        score: 0
      }));
    },
    validateMove: async (guess: string): Promise<ConnectionType> => {
      const word = guess.toUpperCase();
      if (!word) return 'unknown';

      let currentState: GameState | undefined;
      subscribe(s => currentState = s)();
      if (!currentState || currentState.isGameOver) return 'unknown';
      if (currentState.history.some(m => m.word === word)) return 'unknown';

      const prevWord = currentState.currentWord;
      if (isOneLetterDifferent(prevWord, word)) return 'letter';
      if (isAnagram(prevWord, word)) return 'anagram';

      const relations = await fetchRelations(prevWord);
      if (relations.synonyms.includes(word.toLowerCase())) return 'synonym';
      if (relations.antonyms.includes(word.toLowerCase())) return 'antonym';

      return 'unknown';
    },
    makeMove: async (guess: string) => {
      const word = guess.toUpperCase();
      let type: ConnectionType = 'unknown';

      // 1. Basic validation
      let currentState: GameState | undefined;
      subscribe(s => currentState = s)(); 
      
      if (!currentState || currentState.isGameOver) return;
      if (currentState.history.some(m => m.word === word)) return;

      const prevWord = currentState.currentWord;
      
      // 2. Check Letter Change (Synchronous)
      if (isOneLetterDifferent(prevWord, word)) {
          type = 'letter';
      } else if (isAnagram(prevWord, word)) {
          type = 'anagram';
      } else {
          // 3. Check API for Synonyms/Antonyms
          const relations = await fetchRelations(prevWord);
          if (relations.synonyms.includes(word.toLowerCase())) {
              type = 'synonym';
          } else if (relations.antonyms.includes(word.toLowerCase())) {
              type = 'antonym';
          }
      }

      if (type === 'unknown') return;

      update(s => {
        const newHistory = [...s.history, { word, type, previousWord: prevWord, timestamp: Date.now() }];
        const isGameOver = word === s.finishWord;
        return {
          ...s,
          currentWord: word,
          history: newHistory,
          isGameOver,
          score: s.score + 1
        };
      });
    }
  };
}

async function fetchRelations(word: string): Promise<{ synonyms: string[], antonyms: string[] }> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) return { synonyms: [], antonyms: [] };
    const data = await response.json();
    
    const synonyms: string[] = [];
    const antonyms: string[] = [];

    data.forEach((entry: any) => {
      entry.meanings.forEach((meaning: any) => {
        if (meaning.synonyms) synonyms.push(...meaning.synonyms.map((s: string) => s.toLowerCase()));
        if (meaning.antonyms) antonyms.push(...meaning.antonyms.map((a: string) => a.toLowerCase()));
        
        meaning.definitions.forEach((def: any) => {
           if (def.synonyms) synonyms.push(...def.synonyms.map((s: string) => s.toLowerCase()));
           if (def.antonyms) antonyms.push(...def.antonyms.map((a: string) => a.toLowerCase()));
        });
      });
    });

    return { 
      synonyms: Array.from(new Set(synonyms)), 
      antonyms: Array.from(new Set(antonyms)) 
    };
  } catch (e) {
    console.error("API Error:", e);
    return { synonyms: [], antonyms: [] };
  }
}

function isOneLetterDifferent(word1: string, word2: string): boolean {
  if (word1.length !== word2.length) return false;
  let diffs = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) diffs++;
  }
  return diffs === 1;
}

function isAnagram(word1: string, word2: string): boolean {
    if (word1 === word2) return false;
    if (word1.length !== word2.length) return false;
    return word1.split('').sort().join('') === word2.split('').sort().join('');
}

export const game = createGame();
