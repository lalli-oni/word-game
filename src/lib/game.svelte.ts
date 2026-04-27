import { type Journey } from './journeys';
import { dictionaryService } from './dictionary.svelte';
import { calculateObscurity, getLetterDifferences, isAnagram, canonicalWord, displayWord } from './word-utils';
import type { JourneyStep, ValidationResult } from './types';

// Public API Types
export type HintOptions = {
    allowProfanity?: boolean;
    usedWords?: string[];
};

export type Solution = string[];

/**
 * GameAPI - public API for the GameEngine.
 *
 * Methods:
 * - getHint(start, end, options): Promise<string | null>
 * - getFullSolution(start, end, options): Promise<string[] | null>
 * - revealSolution(solution): Promise<void>
 * - makeMove(guess): Promise<boolean>
 *
 * Properties expose current game state and config accessors for UI bindings.
 */
export interface GameAPI {
    // Game state
    startWord: string;
    finishWord: string;
    currentWord: string;
    history: JourneyStep[];
    isGameOver: boolean;
    score: number;
    isSolving: boolean;
    isGenerating: boolean;
    currentJourneyId: string;
    completedJourneys: Record<string, JourneyResult>;
    
    // Config accessors
    allowProfanity: boolean;
    randomWordLength: number;
    randomMaxObscurity: number;
    
    // Methods
    loadJourney(journey: Journey): void;
    loadRandomJourney(): Promise<void>;
    reset(): void;
    validateMove(guess: string): Promise<ValidationResult>;
    makeMove(guess: string): Promise<boolean>;
    solve(): Promise<void>;
    calculateMoveScore(obscurity: number): number;
    getHint(start: string, end: string, options?: HintOptions): Promise<string | null>;
    getFullSolution(start: string, end: string, options?: HintOptions): Promise<Solution | null>;
    revealSolution(solution: Solution): Promise<void>;
}

export interface JourneyResult {
    journeyId: string;
    completedAt: number;
    score: number;
}

const CONFIG_KEY = 'word_connection_config';
const STATE_KEY = 'word_connection_game_state_v2';
const COMPLETED_KEY = 'word_connection_completed_v2';

/**
 * GameEngine - central game state manager.
 * ...
 */
export class GameEngine {
  // Game State (initialized to empty/safe defaults)
  startWord = $state('');
  finishWord = $state('');
  currentWord = $state('');
  history = $state<JourneyStep[]>([]);
  isGameOver = $state(false);
  score = $state(0);
  isSolving = $state(false);
  isGenerating = $state(false);
  currentJourneyId = $state('');
  
  // UI helpers
  suggestedWord = $state<string | null>(null);
  toastMessage = $state('');
  suggestedByWand = $state(false);

  // Stats
  completedJourneys = $state<Record<string, JourneyResult>>({});

  // Pre-generation
  #pregeneratedJourney = $state<Journey | null>(null);
  #isPregenerating = $state(false);

  // Config
  #allowProfanity = $state(false);
  #randomWordLength = $state(4);
  #randomMaxObscurity = $state(10);

  #isApplyingMove = $state(false);

  // Hint/cache storage (moved from DictionaryService)
  #_cachedSolution: { key: string; path: string[] } | null = null;
  // In-flight promise map to deduplicate concurrent solver calls
  #_inflightSolutions: Map<string, Promise<string[] | null>> = new Map();

  get allowProfanity() { return this.#allowProfanity; }
  set allowProfanity(val: boolean) {
      this.#allowProfanity = val;
      this.saveConfig();
      this.triggerPregenerate();
  }

  get randomWordLength() { return this.#randomWordLength; }
  set randomWordLength(val: number) {
      this.#randomWordLength = val;
      this.saveConfig();
      this.triggerPregenerate();
  }

  get randomMaxObscurity() { return this.#randomMaxObscurity; }
  set randomMaxObscurity(val: number) {
      this.#randomMaxObscurity = val;
      this.saveConfig();
      this.triggerPregenerate();
  }







  #validSemanticMoves = $state<{ synonyms: string[], antonyms: string[] }>({ synonyms: [], antonyms: [] });
  #semanticMovesWord = $state<string | null>(null);
  #semanticMovesPromise: Promise<void> | null = null;

  constructor() {
      this.loadConfig();
      if (!this.loadGameState()) {
          this.loadTutorial();
      }
      this.loadCompleted();
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
      if (!this.startWord) return;
      localStorage.setItem(STATE_KEY, JSON.stringify({
          startWord: this.startWord,
          finishWord: this.finishWord,
          currentWord: this.currentWord,
          history: this.history,
          isGameOver: this.isGameOver,
          score: this.score,
          currentJourneyId: this.currentJourneyId,
          version: 2
      }));
  }

  private loadGameState(): boolean {
      const params = new URLSearchParams(window.location.search);
      const urlStart = params.get('s');
      const urlEnd = params.get('e');

      if (urlStart && urlEnd) {
          try {
              const start = displayWord(urlStart);
              const finish = displayWord(urlEnd);
              if (start && finish) {
                  this.startWord = start;
                  this.finishWord = finish;
                  this.currentWord = start;
                  this.history = [{ type: 'origin', word: start, timestamp: Date.now(), obscurity: 0 }];
                  this.isGameOver = false;
                  this.score = 0;
                  this.currentJourneyId = 'shared';
                  window.history.replaceState({}, '', window.location.pathname);
                  return true;
              }
          } catch (e) { console.error('Failed to load shared journey', e); }
      }

      try {
          const saved = localStorage.getItem(STATE_KEY);
          if (saved) {
              const parsed = JSON.parse(saved);
              // Basic validation of required fields
              if (parsed.startWord && parsed.finishWord && Array.isArray(parsed.history) && parsed.history.length > 0) {
                  this.startWord = displayWord(parsed.startWord);
                  this.finishWord = displayWord(parsed.finishWord);
                  this.currentWord = displayWord(parsed.currentWord);
                  this.history = parsed.history.map((h: any) => ({
                      ...h,
                      word: displayWord(h.word || '')
                  })).filter((h: any) => h.word.length > 0);
                  
                  if (this.history.length === 0) return false;

                  this.isGameOver = !!parsed.isGameOver;
                  this.score = Number(parsed.score) || 0;
                  this.currentJourneyId = parsed.currentJourneyId || 'tutorial';
                  return true;
              }
          }
      } catch (e) { 
          console.error('Failed to load game state', e);
          localStorage.removeItem(STATE_KEY);
      }
      return false;
  }

  private loadTutorial() {
      this.startWord = 'COLD';
      this.finishWord = 'WARM';
      this.currentWord = 'COLD';
      this.history = [{ type: 'origin', word: 'COLD', timestamp: Date.now(), obscurity: 0 }];
      this.isGameOver = false;
      this.score = 0;
      this.currentJourneyId = 'tutorial';
  }

  private loadCompleted() {
      try {
          const saved = localStorage.getItem(COMPLETED_KEY);
          if (saved) {
              this.completedJourneys = JSON.parse(saved);
          }
      } catch (e) { console.error('Failed to load completed journeys', e); }
  }

  private saveCompleted(journeyId: string, result: JourneyResult) {
      this.completedJourneys[journeyId] = result;
      localStorage.setItem(COMPLETED_KEY, JSON.stringify(this.completedJourneys));
  }

  async init() {
      await dictionaryService.init();
      await this.#refreshSemanticMoves(this.currentWord);
      this.triggerPregenerate();
  }

  async #refreshSemanticMoves(word: string) {
      const targetWord = displayWord(word);
      if (this.#semanticMovesWord === targetWord) return;
      if (this.#semanticMovesPromise) {
          await this.#semanticMovesPromise;
          if (this.#semanticMovesWord === targetWord) return;
      }

      this.#semanticMovesPromise = this.#loadSemanticMoves(targetWord);
      await this.#semanticMovesPromise;
  }

  async #loadSemanticMoves(word: string) {
      console.log(`[Game] Refreshing semantic moves for: ${word}`);
      const entry = await dictionaryService.getEntry(word);
      if (entry) {
          this.#validSemanticMoves = {
              synonyms: entry.synonyms.map(canonicalWord),
              antonyms: entry.antonyms.map(canonicalWord)
          };
          this.#semanticMovesWord = word;
          console.log(`[Game] Loaded ${entry.synonyms.length} synonyms and ${entry.antonyms.length} antonyms.`);
      } else {
          console.warn(`[Game] No dictionary entry found for: ${word}`);
          this.#validSemanticMoves = { synonyms: [], antonyms: [] };
          this.#semanticMovesWord = word;
      }
      this.#semanticMovesPromise = null;
  }

  loadJourney(journey: Journey) {
      const start = displayWord(journey.startWord);
      this.startWord = start;
      this.finishWord = displayWord(journey.finishWord);
      this.currentWord = start;
      this.history = [{ type: 'origin', word: start, timestamp: Date.now(), obscurity: 0 }];
      this.isGameOver = false;
      this.score = 0;
      this.currentJourneyId = journey.id;
      this.#validSemanticMoves = { synonyms: [], antonyms: [] };
      this.#semanticMovesWord = null;
      this.#semanticMovesPromise = null;
      this.#refreshSemanticMoves(start);
      this.saveGameState();
      this.triggerPregenerate();
  }

  private triggerPregenerate() {
      if (this.#isPregenerating) return;
      this.#pregeneratedJourney = null;
      this.pregenerateRandomJourney();
  }

  private async pregenerateRandomJourney() {
      this.#isPregenerating = true;
      console.time('[Generator] Pregeneration');
      
      let start = '';
      let finish = '';
      let attempts = 0;
      
      try {
          while (attempts < 50) {
              start = await dictionaryService.getRandomWord(this.#randomWordLength);
              finish = await dictionaryService.getRandomWord(this.#randomWordLength);
              if (start === finish) {
                  attempts++;
                  continue;
              }
              
              const path = await dictionaryService.findShortestPath(start, finish, 6, {
                  allowProfanity: this.#allowProfanity
              });
              if (path && path.length >= 3) {
                  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
                  if (path.length <= 3) difficulty = 'easy';
                  else if (path.length >= 6) difficulty = 'hard';

                  this.#pregeneratedJourney = {
                      id: 'random-' + Date.now(),
                      name: 'Mysterious Journey',
                      startWord: start,
                      finishWord: finish,
                      difficulty
                  };
                  break;
              }
              attempts++;
          }
      } finally {
          console.timeEnd('[Generator] Pregeneration');
          this.#isPregenerating = false;
      }
  }

  async loadRandomJourney() {
      if (this.isGenerating) return;

      if (this.#pregeneratedJourney) {
          this.loadJourney(this.#pregeneratedJourney);
          this.#pregeneratedJourney = null;
          this.triggerPregenerate();
          return;
      }

      this.isGenerating = true;
      console.time('[Generator] Direct Generation');
      
      try {
          let timeoutCounter = 0;
          const MAX_TIMEOUT_ATTEMPTS = 5; // Total 5 batches of 50 attempts

          while (!this.#pregeneratedJourney && timeoutCounter < MAX_TIMEOUT_ATTEMPTS) {
              await this.pregenerateRandomJourney();
              if (this.#pregeneratedJourney) break;
              timeoutCounter++;
              await new Promise(r => setTimeout(r, 100)); // Brief pause to prevent UI freezing
          }

          if (this.#pregeneratedJourney) {
              this.loadJourney(this.#pregeneratedJourney!);
              this.#pregeneratedJourney = null;
              this.triggerPregenerate();
          } else {
              console.error('[Generator] Failed to generate a journey in time.');
              // Reset state to avoid UI hang
              this.isGenerating = false;
          }
      } finally {
          console.timeEnd('[Generator] Direct Generation');
          this.isGenerating = false;
      }
  }

  async solve() {
      if (this.isGameOver || this.isSolving) return;
      this.isSolving = true;

      console.time('[Solver] Dijkstra');
      const path = await dictionaryService.findShortestPath(this.currentWord, this.finishWord, 10, {
          allowProfanity: this.#allowProfanity,
          usedWords: this.history.map(step => step.word)
      });
      console.timeEnd('[Solver] Dijkstra');

      if (!path) {
          console.error('[Solver] No path found!');
          this.isSolving = false;
          return;
      }

      for (let i = 1; i < path.length; i++) {
          await new Promise(r => setTimeout(r, 400));
          await this.makeMove(path[i]);
      }
      
      this.isSolving = false;
  }

  async undoMove() {
      if (this.history.length <= 1 || this.isSolving || this.#isApplyingMove) return;
      this.#isApplyingMove = true;
      
      try {
          const removedStep = this.history.pop();
          if (!removedStep) return;

          const lastStep = this.history[this.history.length - 1];
          this.currentWord = lastStep.word;
          this.score = Math.max(0, this.score - (removedStep.score || 0));
          this.isGameOver = false;

          this.invalidateCachedSolution();
          await this.#refreshSemanticMoves(this.currentWord);
          this.saveGameState();
      } finally {
          this.#isApplyingMove = false;
      }
  }

  reset() {
      if (this.isSolving) return;
      this.currentWord = this.startWord;
      this.history = [{ type: 'origin', word: this.startWord, timestamp: Date.now(), obscurity: 0 }];
      this.isGameOver = false;
      this.score = 0;
      this.#validSemanticMoves = { synonyms: [], antonyms: [] };
      this.#semanticMovesWord = null;
      this.#semanticMovesPromise = null;
      this.invalidateCachedSolution();
      this.#refreshSemanticMoves(this.startWord);
      this.saveGameState();
  }

  calculateMoveScore(obscurity: number): number {
      return Math.max(10, 100 - (obscurity * 8));
  }

  async validateMove(guess: string): Promise<ValidationResult> {
      const word = displayWord(guess);
      if (!word || word.length < 2) return { isValid: false, errors: [] };
      if (this.isGameOver) return { isValid: false, errors: ['Game is over'] };
      
      if (this.history.some(m => displayWord(m.word) === word)) {
          return { isValid: false, errors: [`"${word}" has already been used.`] };
      }

      const prevWord = this.currentWord;
      const errors: string[] = [];
      const diffCount = getLetterDifferences(prevWord, word);

      await this.#refreshSemanticMoves(prevWord);
      
      const entry = await dictionaryService.getEntry(word);
      const exists = !!entry;
      const isProfane = entry?.tags.includes('profanity');
      const isVisible = exists && (this.#allowProfanity || !isProfane);

      if (!exists) {
          errors.push(`"${word}" is not in our dictionary.`);
      } else if (!isVisible) {
          errors.push(`"${word}" is filtered by profanity settings.`);
      }

      const obscurity = entry ? calculateObscurity(entry.rank) : 10;

      if (prevWord.length !== word.length) {
          return { 
              isValid: false, 
              errors: [`Word length must match the current word ("${prevWord}" is ${prevWord.length} letters).`],
              obscurity
          };
      }

      if (diffCount === 1 && isVisible) {
          return { isValid: true, action: 'morph', errors: [], obscurity };
      }

      if (isAnagram(prevWord, word) && isVisible) {
          return { isValid: true, action: 'anagram', errors: [], obscurity };
      }

      const wordLower = canonicalWord(word);
      if (isVisible && this.#validSemanticMoves.synonyms.includes(wordLower)) {
          return { isValid: true, action: 'synonym', errors: [], obscurity };
      }
      if (isVisible && this.#validSemanticMoves.antonyms.includes(wordLower)) {
          return { isValid: true, action: 'antonym', errors: [], obscurity };
      }

      if (isVisible) {
          errors.push(`"${word}" is not a known connection from "${prevWord}".`);
      }

      return { 
          isValid: false, 
          errors, 
          diffCount: (isVisible && prevWord.length === word.length) ? diffCount : undefined,
          obscurity
      };
  }

  async makeMove(guess: string): Promise<boolean> {
      if (this.#isApplyingMove) return false;
      this.#isApplyingMove = true;

      try {
          const word = displayWord(guess);
          const validation = await this.validateMove(guess);
          if (!validation.isValid || !validation.action) return false;

          // Auto-invalidation: if a cached canonical solution exists but the player's chosen move deviates
          try {
            const options = { allowProfanity: this.#allowProfanity, usedWords: this.history.map(step => step.word) };
            if (this.hasCachedSolution()) {
              const solution = await this.getFullSolution(this.currentWord, this.finishWord, options);
              if (solution && solution.length >= 2 && displayWord(solution[1]) !== word) {
                // Player deviated from previously computed canonical path — invalidate cache
                this.invalidateCachedSolution();
                console.log('[Game] Hint cache invalidated due to player deviation');
              }
            }
          } catch (e) {
            console.warn('[Game] Hint cache check failed', e);
          }

          const moveScore = this.calculateMoveScore(validation.obscurity || 0);
          
          this.currentWord = word;
          const isGoal = (word === this.finishWord);

          if (isGoal) {
              this.history.push({
                  type: 'destination',
                  word,
                  action: validation.action,
                  timestamp: Date.now(),
                  obscurity: validation.obscurity || 0,
                  score: moveScore,
                  isReached: true
              });
          } else {
              this.history.push({ 
                  type: 'waypoint',
                  word, 
                  action: validation.action,
                  timestamp: Date.now(),
                  obscurity: validation.obscurity || 0,
                  score: moveScore
              });
          }
          
          this.isGameOver = isGoal;
          this.score += moveScore;

          if (this.isGameOver && this.currentJourneyId !== 'shared') {
              this.saveCompleted(this.currentJourneyId, {
                  journeyId: this.currentJourneyId,
                  completedAt: Date.now(),
                  score: this.score
              });
          }

          await this.#refreshSemanticMoves(word);
          this.saveGameState();
          return true;
      } finally {
          this.#isApplyingMove = false;
      }
  }

  // Hint/cache helpers moved into GameEngine
  makeSolutionCacheKey(start: string, end: string, options?: { allowProfanity?: boolean; usedWords?: string[] }) {
    const s = canonicalWord(start);
    const e = canonicalWord(end);
    const used = (options?.usedWords || []).map(canonicalWord).slice().sort().join(',');
    return `${s}|${e}|${options?.allowProfanity ? '1' : '0'}|${used}`;
  }

  hasCachedSolution() {
    return !!this.#_cachedSolution;
  }

  invalidateCachedSolution() {
    this.#_cachedSolution = null;
  }

  /**
   * Compute or return a cached full solution path between start and end.
   * Deduplicates concurrent calls by key.
   */
  async getFullSolution(start: string, end: string, options?: { allowProfanity?: boolean; usedWords?: string[] }) {
    const key = this.makeSolutionCacheKey(start, end, options);
    if (this.#_cachedSolution && this.#_cachedSolution.key === key) {
      return this.#_cachedSolution.path;
    }
    if (this.#_inflightSolutions.has(key)) {
      return await this.#_inflightSolutions.get(key)!;
    }
    const p = (async () => {
      const path = await dictionaryService.findShortestPath(start, end, 10, options);
      if (path && path.length) {
        this.#_cachedSolution = { key, path };
      }
      return path;
    })();

    this.#_inflightSolutions.set(key, p);
    try {
      const res = await p;
      return res;
    } finally {
      this.#_inflightSolutions.delete(key);
    }
  }

  async getHint(start: string, end: string, options?: { allowProfanity?: boolean; usedWords?: string[] }) {
    const path = await this.getFullSolution(start, end, options);
    if (!path || path.length < 2) return null;
    return path[1];
  }

  // revealSolution: apply remaining moves to show solution (calls makeMove for each step)
  async revealSolution(solution: string[]) {
    if (!solution || solution.length === 0) return;
    // If solution includes currentWord as first element, skip it
    let idx = 0;
    if (displayWord(solution[0]) === displayWord(this.currentWord)) idx = 1;
    for (; idx < solution.length; idx++) {
      const w = solution[idx];
      // attempt move; if invalid, stop
      const ok = await this.makeMove(w);
      if (!ok) break;
      // small delay to allow UI updates (non-blocking), but keep it minimal
      await new Promise((r) => setTimeout(r, 120));
    }
  }
}


export const game = new GameEngine();
