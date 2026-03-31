import { type Journey } from './journeys';
import { dictionaryService } from './dictionary.svelte';

export type ConnectionType = 'initial' | 'letter' | 'synonym' | 'antonym' | 'anagram' | 'unknown';

export interface Move {
  word: string;
  type: ConnectionType;
  previousWord?: string;
  timestamp: number;
  obscurity?: number; // 0 (common) to 10 (obscure)
}

export interface ValidationResult {
  isValid: boolean;
  type: ConnectionType;
  errors: string[];
  diffCount?: number;
  obscurity?: number;
}

const CONFIG_KEY = 'word_connection_config';
const STATE_KEY = 'word_connection_game_state';

export class GameEngine {
  // Game State
  startWord = $state('COLD');
  finishWord = $state('WARM');
  currentWord = $state('COLD');
  history = $state<Move[]>([{ word: 'COLD', type: 'initial', timestamp: Date.now(), obscurity: 0 }]);
  isGameOver = $state(false);
  score = $state(0);
  
  // Persisted Config
  #allowProfanity = $state(false);
  #randomWordLength = $state(4);
  #randomMaxObscurity = $state(10);

  get allowProfanity() { return this.#allowProfanity; }
  set allowProfanity(val: boolean) {
      this.#allowProfanity = val;
      this.saveConfig();
  }

  get randomWordLength() { return this.#randomWordLength; }
  set randomWordLength(val: number) {
      this.#randomWordLength = val;
      this.saveConfig();
  }

  get randomMaxObscurity() { return this.#randomMaxObscurity; }
  set randomMaxObscurity(val: number) {
      this.#randomMaxObscurity = val;
      this.saveConfig();
  }
  
  #validSemanticMoves = $state<{ synonyms: string[], antonyms: string[] }>({ synonyms: [], antonyms: [] });

  constructor() {
      this.loadConfig();
      this.loadGameState();
      this.init();
  }

  private loadConfig() {
      try {
          const saved = localStorage.getItem(CONFIG_KEY);
          if (saved) {
              const parsed = JSON.parse(saved);
              this.#allowProfanity = parsed.allowProfanity ?? false;
              this.#randomWordLength = parsed.randomWordLength ?? 4;
              this.#randomMaxObscurity = parsed.randomMaxObscurity ?? 10;
          }
      } catch (e) { console.error('Failed to load config', e); }
  }

  private saveConfig() {
      localStorage.setItem(CONFIG_KEY, JSON.stringify({
          allowProfanity: this.#allowProfanity,
          randomWordLength: this.#randomWordLength,
          randomMaxObscurity: this.#randomMaxObscurity
      }));
  }

  private saveGameState() {
      localStorage.setItem(STATE_KEY, JSON.stringify({
          startWord: this.startWord,
          finishWord: this.finishWord,
          currentWord: this.currentWord,
          history: this.history,
          isGameOver: this.isGameOver,
          score: this.score
      }));
  }

  private loadGameState() {
      try {
          const saved = localStorage.getItem(STATE_KEY);
          if (saved) {
              const parsed = JSON.parse(saved);
              this.startWord = parsed.startWord;
              this.finishWord = parsed.finishWord;
              this.currentWord = parsed.currentWord;
              this.history = parsed.history;
              this.isGameOver = parsed.isGameOver;
              this.score = parsed.score;
          }
      } catch (e) { console.error('Failed to load game state', e); }
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

  loadJourney(journey: Journey) {
      const start = journey.startWord.toUpperCase();
      this.startWord = start;
      this.finishWord = journey.finishWord.toUpperCase();
      this.currentWord = start;
      this.history = [{ word: start, type: 'initial', timestamp: Date.now(), obscurity: 0 }];
      this.isGameOver = false;
      this.score = 0;
      this.#validSemanticMoves = { synonyms: [], antonyms: [] };
      this.#refreshSemanticMoves(start);
      this.saveGameState();
  }

  async loadRandomJourney() {
      let start = await dictionaryService.getRandomWord(this.#randomWordLength);
      let finish = await dictionaryService.getRandomWord(this.#randomWordLength);
      
      let attempts = 0;
      while (attempts < 20 && (finish === start || !(await dictionaryService.areConnected(start, finish, 3)))) {
          finish = await dictionaryService.getRandomWord(this.#randomWordLength);
          attempts++;
      }

      this.loadJourney({
          id: 'random-' + Date.now(),
          name: 'Mysterious Journey',
          startWord: start,
          finishWord: finish,
          difficulty: 'medium'
      });
  }

  reset() {
      this.currentWord = this.startWord;
      this.history = [{ word: this.startWord, type: 'initial', timestamp: Date.now(), obscurity: 0 }];
      this.isGameOver = false;
      this.score = 0;
      this.#refreshSemanticMoves(this.startWord);
      this.saveGameState();
  }

  calculateObscurity(rank: number): number {
    if (rank <= 1000) return 0;
    if (rank <= 5000) return 1;
    if (rank <= 10000) return 2;
    if (rank <= 20000) return 3;
    if (rank <= 30000) return 4;
    if (rank <= 40000) return 5;
    if (rank <= 50000) return 6;
    if (rank <= 60000) return 7;
    if (rank <= 70000) return 8;
    if (rank <= 80000) return 9;
    return 10;
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
      const isVisible = entry && (this.#allowProfanity || !entry.tags.includes('profanity'));

      if (!isVisible) {
          errors.push(`"${word}" is not in our dictionary.`);
      }

      const obscurity = entry ? this.calculateObscurity(entry.rank) : 10;

      if (diffCount === 1 && prevWord.length === word.length && isVisible) {
          return { isValid: true, type: 'letter', errors: [], obscurity };
      }

      if (isAnagram(prevWord, word) && isVisible) {
          return { isValid: true, type: 'anagram', errors: [], obscurity };
      }

      if (isVisible && this.#validSemanticMoves.synonyms.includes(word.toLowerCase())) {
          return { isValid: true, type: 'synonym', errors: [], obscurity };
      }
      if (isVisible && this.#validSemanticMoves.antonyms.includes(word.toLowerCase())) {
          return { isValid: true, type: 'antonym', errors: [], obscurity };
      }

      if (prevWord.length !== word.length) {
          if (isVisible) errors.push('Word length must match for a Morph or Anagram.');
      } else if (diffCount > 1) {
          if (isVisible) errors.push(`A Morph only allows 1 letter change (you changed ${diffCount}).`);
      }

      if (isVisible) {
          errors.push(`"${word}" is not a known synonym or antonym of "${prevWord}".`);
      }

      return { 
          isValid: false, 
          type: 'unknown', 
          errors, 
          diffCount: (isVisible && prevWord.length === word.length) ? diffCount : undefined,
          obscurity
      };
  }

  async makeMove(guess: string) {
      const word = guess.toUpperCase();
      const validation = await this.validateMove(guess);
      if (!validation.isValid) return;

      const prev = this.currentWord;
      this.currentWord = word;
      this.history.push({ 
          word, 
          type: validation.type, 
          previousWord: prev, 
          timestamp: Date.now(),
          obscurity: validation.obscurity
      });
      this.isGameOver = (word === this.finishWord);
      this.score++;

      this.#refreshSemanticMoves(word);
      this.saveGameState();
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
