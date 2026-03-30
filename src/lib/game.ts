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

export interface ValidationResult {
  isValid: boolean;
  type: ConnectionType;
  errors: string[];
  diffCount?: number;
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
    validateMove: async (guess: string): Promise<ValidationResult> => {
      const word = guess.toUpperCase();
      if (!word || word.length < 2) return { isValid: false, type: 'unknown', errors: [] };

      let currentState: GameState | undefined;
      subscribe(s => currentState = s)();
      if (!currentState || currentState.isGameOver) return { isValid: false, type: 'unknown', errors: ['Game is over'] };
      
      if (currentState.history.some(m => m.word === word)) {
          return { isValid: false, type: 'unknown', errors: [`"${word}" has already been used.`] };
      }

      const prevWord = currentState.currentWord;
      const errors: string[] = [];
      
      // 1. Check Morph (Single Letter Change)
      const diffCount = getLetterDifferences(prevWord, word);
      if (diffCount === 1 && prevWord.length === word.length) {
          return { isValid: true, type: 'letter', errors: [] };
      }

      // 2. Check Anagram
      if (isAnagram(prevWord, word)) {
          return { isValid: true, type: 'anagram', errors: [] };
      }

      // 3. Check Dictionary & Relations (Asynchronous)
      const relations = await fetchRelations(prevWord);
      if (relations.synonyms.includes(word.toLowerCase())) {
          return { isValid: true, type: 'synonym', errors: [] };
      }
      if (relations.antonyms.includes(word.toLowerCase())) {
          return { isValid: true, type: 'antonym', errors: [] };
      }

      // --- Not valid, collect errors ---
      
      // Length check
      if (prevWord.length !== word.length) {
          errors.push('Word length must match for a Morph or Anagram.');
      } else if (diffCount > 1) {
          errors.push(`A Morph only allows 1 letter change (you changed ${diffCount}).`);
      }

      // Semantic check
      errors.push(`"${word}" is not a known synonym or antonym of "${prevWord}".`);

      // Dictionary existence check
      const exists = await checkWordExists(word);
      if (!exists) {
          errors.push(`"${word}" is not a valid English word.`);
      }

      return { 
          isValid: false, 
          type: 'unknown', 
          errors, 
          diffCount: prevWord.length === word.length ? diffCount : undefined 
      };
    },
    makeMove: async (guess: string) => {
      const word = guess.toUpperCase();
      const validation = await game.validateMove(guess);
      if (!validation.isValid) return;

      update(s => {
        const newHistory = [...s.history, { word, type: validation.type, previousWord: s.currentWord, timestamp: Date.now() }];
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
    return { synonyms: [], antonyms: [] };
  }
}

async function checkWordExists(word: string): Promise<boolean> {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        return response.ok;
    } catch {
        return false;
    }
}

function getLetterDifferences(word1: string, word2: string): number {
  if (word1.length !== word2.length) return -1;
  let diffs = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) diffs++;
  }
  return diffs;
}

function isAnagram(word1: string, word2: string): boolean {
    if (word1 === word2) return false;
    if (word1.length !== word2.length) return false;
    return word1.split('').sort().join('') === word2.split('').sort().join('');
}

export const game = createGame();
