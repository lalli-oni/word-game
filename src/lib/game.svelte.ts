import { type Scenario } from './scenarios';
import { dictionaryService } from './dictionary.svelte';

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

export class GameEngine {
  startWord = $state('COLD');
  finishWord = $state('WARM');
  currentWord = $state('COLD');
  history = $state<Move[]>([{ word: 'COLD', type: 'initial', timestamp: Date.now() }]);
  isGameOver = $state(false);
  score = $state(0);
  allowProfanity = $state(false);
  
  #validSemanticMoves = $state<{ synonyms: string[], antonyms: string[] }>({ synonyms: [], antonyms: [] });

  constructor() {
      this.init();
  }

  async init() {
      await dictionaryService.init();
      this.#refreshSemanticMoves(this.currentWord);
  }

  async #refreshSemanticMoves(word: string) {
      const entry = await dictionaryService.getEntry(word);
      if (entry) {
          this.#validSemanticMoves = {
              synonyms: entry.synonyms,
              antonyms: entry.antonyms
          };
      } else {
          this.#validSemanticMoves = { synonyms: [], antonyms: [] };
      }
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

  async loadRandomScenario() {
      const start = await dictionaryService.getRandomWord();
      let finish = await dictionaryService.getRandomWord();
      
      // Ensure words are different and somewhat same-ish length for a better challenge
      while (finish === start || Math.abs(start.length - finish.length) > 2) {
          finish = await dictionaryService.getRandomWord();
      }

      this.loadScenario({
          id: 'random-' + Date.now(),
          name: 'Random Challenge',
          startWord: start,
          finishWord: finish,
          difficulty: 'medium'
      });
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
      
      const entry = await dictionaryService.getEntry(word);
      if (!entry) {
          errors.push(`"${word}" is not in our dictionary.`);
      } else if (!this.allowProfanity && entry.tags.includes('profanity')) {
          errors.push(`"${word}" is a restricted word.`);
      }

      if (diffCount === 1 && prevWord.length === word.length && entry && (this.allowProfanity || !entry.tags.includes('profanity'))) {
          return { isValid: true, type: 'letter', errors: [] };
      }

      if (isAnagram(prevWord, word) && entry && (this.allowProfanity || !entry.tags.includes('profanity'))) {
          return { isValid: true, type: 'anagram', errors: [] };
      }

      if (this.#validSemanticMoves.synonyms.includes(word.toLowerCase())) {
          return { isValid: true, type: 'synonym', errors: [] };
      }
      if (this.#validSemanticMoves.antonyms.includes(word.toLowerCase())) {
          return { isValid: true, type: 'antonym', errors: [] };
      }

      if (prevWord.length !== word.length) {
          errors.push('Word length must match for a Morph or Anagram.');
      } else if (diffCount > 1) {
          errors.push(`A Morph only allows 1 letter change (you changed ${diffCount}).`);
      }

      if (entry) {
          errors.push(`"${word}" is not a known synonym or antonym of "${prevWord}".`);
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
