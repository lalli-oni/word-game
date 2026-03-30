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

// Simple persistent cache for API results
const API_CACHE_KEY = 'word_connection_api_cache';
const getCache = () => JSON.parse(localStorage.getItem(API_CACHE_KEY) || '{}');
const setCache = (word: string, data: any) => {
    const cache = getCache();
    cache[word.toLowerCase()] = { data, timestamp: Date.now() };
    localStorage.setItem(API_CACHE_KEY, JSON.stringify(cache));
};

export class GameEngine {
  // Svelte 5 state runes
  startWord = $state('COLD');
  finishWord = $state('WARM');
  currentWord = $state('COLD');
  history = $state<Move[]>([{ word: 'COLD', type: 'initial', timestamp: Date.now() }]);
  isGameOver = $state(false);
  score = $state(0);
  
  // Local cache for the current turn's valid semantic moves
  #validSemanticMoves = $state<{ synonyms: string[], antonyms: string[] }>({ synonyms: [], antonyms: [] });

  constructor() {
      this.#refreshSemanticMoves(this.currentWord);
  }

  async #refreshSemanticMoves(word: string) {
      const relations = await fetchRelations(word);
      this.#validSemanticMoves = relations;
  }

  loadScenario(scenario: Scenario) {
      const start = scenario.startWord.toUpperCase();
      this.startWord = start;
      this.finishWord = scenario.finishWord.toUpperCase();
      this.currentWord = start;
      this.history = [{ word: start, type: 'initial', timestamp: Date.now() }];
      this.isGameOver = false;
      this.score = 0;
      this.#validSemanticMoves = { synonyms: [], antonyms: [] };
      this.#refreshSemanticMoves(start);
  }

  reset() {
      this.currentWord = this.startWord;
      this.history = [{ word: this.startWord, type: 'initial', timestamp: Date.now() }];
      this.isGameOver = false;
      this.score = 0;
      this.#refreshSemanticMoves(this.startWord);
  }

  async validateMove(guess: string): Promise<ValidationResult> {
      const word = guess.toUpperCase();
      if (!word || word.length < 2) return { isValid: false, type: 'unknown', errors: [] };
      if (this.isGameOver) return { isValid: false, type: 'unknown', errors: ['Game is over'] };
      
      if (this.history.some(m => m.word === word)) {
          return { isValid: false, type: 'unknown', errors: [`"${word}" has already been used.`] };
      }

      const prevWord = this.currentWord;
      const errors: string[] = [];
      const diffCount = getLetterDifferences(prevWord, word);
      
      if (diffCount === 1 && prevWord.length === word.length) {
          return { isValid: true, type: 'letter', errors: [] };
      }

      if (isAnagram(prevWord, word)) {
          return { isValid: true, type: 'anagram', errors: [] };
      }

      if (this.#validSemanticMoves.synonyms.includes(word.toLowerCase())) {
          return { isValid: true, type: 'synonym', errors: [] };
      }
      if (this.#validSemanticMoves.antonyms.includes(word.toLowerCase())) {
          return { isValid: true, type: 'antonym', errors: [] };
      }

      if (prevWord.length !== word.length) {
          const exists = await checkWordExists(word);
          if (!exists) errors.push(`"${word}" is not a valid English word.`);
          errors.push('Word length must match for a Morph or Anagram.');
      } else if (diffCount > 1) {
          errors.push(`A Morph only allows 1 letter change (you changed ${diffCount}).`);
      }

      errors.push(`"${word}" is not a known synonym or antonym of "${prevWord}".`);

      const exists = await checkWordExists(word);
      if (!exists && !errors.includes(`"${word}" is not a valid English word.`)) {
          errors.push(`"${word}" is not a valid English word.`);
      }

      return { 
          isValid: false, 
          type: 'unknown', 
          errors, 
          diffCount: prevWord.length === word.length ? diffCount : undefined 
      };
  }

  async makeMove(guess: string) {
      const word = guess.toUpperCase();
      const validation = await this.validateMove(guess);
      if (!validation.isValid) return;

      const prev = this.currentWord;
      this.currentWord = word;
      this.history.push({ word, type: validation.type, previousWord: prev, timestamp: Date.now() });
      this.isGameOver = (word === this.finishWord);
      this.score++;

      this.#refreshSemanticMoves(word);
  }
}

async function fetchRelations(word: string): Promise<{ synonyms: string[], antonyms: string[] }> {
  const cache = getCache();
  const cached = cache[word.toLowerCase()];
  if (cached && Date.now() - cached.timestamp < 86400000) return cached.data;

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

    const result = { synonyms: Array.from(new Set(synonyms)), antonyms: Array.from(new Set(antonyms)) };
    setCache(word, result);
    return result;
  } catch (e) {
    return { synonyms: [], antonyms: [] };
  }
}

async function checkWordExists(word: string): Promise<boolean> {
    const cache = getCache();
    if (cache[word.toLowerCase()]) return true;
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (response.ok) {
            fetchRelations(word); 
            return true;
        }
        return false;
    } catch { return false; }
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
    if (word1 === word2 || word1.length !== word2.length) return false;
    return word1.split('').sort().join('') === word2.split('').sort().join('');
}

export const game = new GameEngine();
