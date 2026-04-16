import { type Journey } from './journeys';
import { dictionaryService } from './dictionary.svelte';
import { calculateObscurity, getLetterDifferences, isAnagram } from './word-utils';
import type { JourneyStep, ValidationResult } from './types';

export interface JourneyResult {
    journeyId: string;
    completedAt: number;
    score: number;
}

const CONFIG_KEY = 'word_connection_config';
const STATE_KEY = 'word_connection_game_state';
const COMPLETED_KEY = 'word_connection_completed';

export class GameEngine {
  // Game State
  startWord = $state('COLD');
  finishWord = $state('WARM');
  currentWord = $state('COLD');
  history = $state<JourneyStep[]>([
      { type: 'origin', word: 'COLD', timestamp: Date.now(), obscurity: 0 }
  ]);
  isGameOver = $state(false);
  score = $state(0);
  isSolving = $state(false);
  isGenerating = $state(false);
  currentJourneyId = $state('tutorial');
  
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
      this.loadGameState();
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
      localStorage.setItem(STATE_KEY, JSON.stringify({
          startWord: this.startWord,
          finishWord: this.finishWord,
          currentWord: this.currentWord,
          history: this.history,
          isGameOver: this.isGameOver,
          score: this.score,
          currentJourneyId: this.currentJourneyId
      }));
  }

  private loadGameState() {
      const params = new URLSearchParams(window.location.search);
      const urlStart = params.get('s');
      const urlEnd = params.get('e');

      if (urlStart && urlEnd) {
          this.startWord = urlStart.toUpperCase();
          this.finishWord = urlEnd.toUpperCase();
          this.currentWord = this.startWord;
          this.history = [{ type: 'origin', word: this.startWord, timestamp: Date.now(), obscurity: 0 }];
          this.isGameOver = false;
          this.score = 0;
          this.currentJourneyId = 'shared';
          window.history.replaceState({}, '', window.location.pathname);
          return;
      }

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
              this.currentJourneyId = parsed.currentJourneyId || 'tutorial';
          }
      } catch (e) { console.error('Failed to load game state', e); }
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
      const targetWord = word.toUpperCase();
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
              synonyms: entry.synonyms,
              antonyms: entry.antonyms
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
      const start = journey.startWord.toUpperCase();
      this.startWord = start;
      this.finishWord = journey.finishWord.toUpperCase();
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

  reset() {
      this.currentWord = this.startWord;
      this.history = [{ type: 'origin', word: this.startWord, timestamp: Date.now(), obscurity: 0 }];
      this.isGameOver = false;
      this.score = 0;
      this.#validSemanticMoves = { synonyms: [], antonyms: [] };
      this.#semanticMovesWord = null;
      this.#semanticMovesPromise = null;
      this.#refreshSemanticMoves(this.startWord);
      this.saveGameState();
  }

  calculateMoveScore(obscurity: number): number {
      return Math.max(10, 100 - (obscurity * 8));
  }

  async validateMove(guess: string): Promise<ValidationResult> {
      const word = guess.toUpperCase();
      if (!word || word.length < 2) return { isValid: false, errors: [] };
      if (this.isGameOver) return { isValid: false, errors: ['Game is over'] };
      
      if (this.history.some(m => m.word === word)) {
          return { isValid: false, errors: [`"${word}" has already been used.`] };
      }

      const prevWord = this.currentWord;
      const errors: string[] = [];
      const diffCount = getLetterDifferences(prevWord, word);

      await this.#refreshSemanticMoves(prevWord);
      
      const entry = await dictionaryService.getEntry(word);
      const isVisible = entry && (this.#allowProfanity || !entry.tags.includes('profanity'));

      if (!isVisible) {
          errors.push(`"${word}" is not in our dictionary.`);
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

      const wordLower = word.toLowerCase();
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
          const word = guess.toUpperCase();
          const validation = await this.validateMove(guess);
          if (!validation.isValid || !validation.action) return false;
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
}

export const game = new GameEngine();
