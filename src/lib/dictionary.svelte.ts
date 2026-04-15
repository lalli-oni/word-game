import { openDB, type IDBPDatabase } from 'idb';
import { errorService } from './error.svelte';
import { calculateObscurity, isAnagram, isOneLetterDifferent } from './word-utils';

export interface DictionaryEntry {
  word: string;
  synonyms: string[];
  antonyms: string[];
  tags: string[];
  rank: number;
  isPriority?: boolean;
  neighbors?: string[];
}

class DictionaryService {
  private dbName = 'WordConnectionDB';
  private dbVersion = 3;
  private db: IDBPDatabase | null = null;
  private HASH_KEY = 'dictionary_content_hash';

  #hydrationSource: Record<string, any> | null = null;
  
  status = $state<'idle' | 'hydrating' | 'ready' | 'error'>('idle');
  isPriorityLoaded = $state(false);
  totalBatches = $state(0);
  completedBatches = $state(0);
  errorMessage = $state<string | null>(null);

  overallProgress = $derived(this.totalBatches > 0 ? Math.round((this.completedBatches / this.totalBatches) * 100) : 0);

  private getAssetUrl(filename: string) {
      const base = import.meta.env.BASE_URL;
      const cleanBase = base.endsWith('/') ? base : base + '/';
      return `${cleanBase}${filename}`;
  }

  async init() {
    if (this.db) return;

    try {
        console.log('[IDB] Initializing dictionary service...');
        this.db = await openDB(this.dbName, this.dbVersion, {
          upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`[IDB] Upgrading database from ${oldVersion} to ${newVersion}`);
            let store;
            if (oldVersion < 1) {
              store = db.createObjectStore('dictionary', { keyPath: 'word' });
              store.createIndex('by-tag', 'tags', { multiEntry: true });
            } else {
              store = transaction.objectStore('dictionary');
            }

            if (oldVersion < 2) {
              store.createIndex('by-length', 'length');
            }
          },
        });

        const count = await this.db.count('dictionary');
        console.log(`[IDB] Current word count: ${count}`);
        
        let remoteHash = '';
        try {
            const hUrl = this.getAssetUrl('dictionary.hash');
            const hResp = await fetch(hUrl);
            if (hResp.ok) {
                remoteHash = (await hResp.text()).trim();
            }
        } catch (e: any) {
            console.warn('[IDB] Could not fetch dictionary hash', e);
        }

        const localHash = localStorage.getItem(this.HASH_KEY);
        const needsHydration = count === 0 || (remoteHash && remoteHash !== localHash);

        if (needsHydration) {
          console.log(`[IDB] RE-HYDRATION TRIGGERED. Reason: ${count === 0 ? 'Empty DB' : 'Hash mismatch'}`);
          await this.hydrate(remoteHash);
        } else {
          console.log('[IDB] Database is up to date.');
          this.isPriorityLoaded = true;
          this.status = 'ready';
        }
    } catch (e: any) {
        this.status = 'error';
        this.errorMessage = e.message || 'Unknown database error';
        errorService.report(`Database Initialization Failed: ${this.errorMessage}`, e.stack, { dbCount: 'unknown' });
        throw e;
    }
  }

  private async hydrate(newHash: string) {
    this.status = 'hydrating';
    this.completedBatches = 0;
    this.totalBatches = 0;
    this.errorMessage = null;

    try {
      const dUrl = this.getAssetUrl('dictionary.json');
      console.log(`[IDB] Fetching dictionary from: ${dUrl}`);
      const response = await fetch(dUrl);
      if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText} for ${dUrl}`);
      }
      
      const data: Record<string, any> = await response.json();
      this.#hydrationSource = data;
      const allWords = Object.keys(data);
      
      // Separate priority words
      const priorityBatch: string[] = [];
      const standardWords: string[] = [];
      
      for (const word of allWords) {
          if (data[word].isPriority) {
              priorityBatch.push(word);
          } else {
              standardWords.push(word);
          }
      }

      const BATCH_SIZE = 5000;
      const numStandardBatches = Math.ceil(standardWords.length / BATCH_SIZE);
      this.totalBatches = 1 + numStandardBatches; // Priority + Standard chunks

      console.log(`[IDB] Starting hydration: ${priorityBatch.length} priority words, ${standardWords.length} standard words.`);
      
      const tx = this.db!.transaction('dictionary', 'readwrite');
      const store = tx.objectStore('dictionary');
      await store.clear();
      await tx.done;

      // 1. Process Priority Batch
      await this.processBatch(priorityBatch, data);
      this.completedBatches = 1;
      this.isPriorityLoaded = true;
      console.log('[IDB] Priority batch loaded. Ready for play.');
      
      // 2. Process Standard Batches (async)
      this.processRemaining(standardWords, data, BATCH_SIZE, newHash);
      
      this.status = 'ready';
    } catch (error: any) {
      this.status = 'error';
      this.errorMessage = error.message;
      errorService.report(`Dictionary Hydration Failed: ${this.errorMessage}`, error.stack);
      throw error;
    }
  }

  private async processRemaining(words: string[], data: Record<string, any>, batchSize: number, newHash: string) {
      for (let i = 0; i < words.length; i += batchSize) {
          const chunk = words.slice(i, i + batchSize);
          await new Promise(resolve => setTimeout(resolve, 0)); // Yield thread
          await this.processBatch(chunk, data);
          this.completedBatches++;
      }
      
      if (newHash) {
          localStorage.setItem(this.HASH_KEY, newHash);
      }
      this.#hydrationSource = null;
      console.log('[IDB] All batches completed. Memory fallback released.');
  }

  private async processBatch(words: string[], data: Record<string, any>) {
      const tx = this.db!.transaction('dictionary', 'readwrite');
      const store = tx.objectStore('dictionary');
      
      for (const word of words) {
          await store.put({
            word,
            length: word.length,
            ...data[word]
          });
      }
      await tx.done;
  }

  async getEntry(word: string): Promise<DictionaryEntry | undefined> {
    const wordLower = word.toLowerCase();
    if (!this.db) await this.init();
    
    // 1. Try IndexedDB
    const entry = await this.db!.get('dictionary', wordLower);
    if (entry) return entry;
    
    // 2. Fallback to in-memory source during hydration
    if (this.#hydrationSource && this.#hydrationSource[wordLower]) {
        return {
            word: wordLower,
            length: wordLower.length,
            ...this.#hydrationSource[wordLower]
        };
    }
    
    return undefined;
  }

  async getRandomWord(length?: number): Promise<string> {
      if (!this.db) await this.init();
      const tx = this.db!.transaction('dictionary', 'readonly');
      const store = tx.objectStore('dictionary');
      let cursor;
      let count;

      if (length) {
          const index = store.index('by-length');
          count = await index.count(length);
          if (count === 0) return this.getRandomWord();
          const randomIndex = Math.floor(Math.random() * count);
          cursor = await index.openCursor(length);
          if (randomIndex > 0) await cursor?.advance(randomIndex);
      } else {
          count = await store.count();
          const randomIndex = Math.floor(Math.random() * count);
          cursor = await store.openCursor();
          if (randomIndex > 0) await cursor?.advance(randomIndex);
      }
      return cursor?.value.word.toUpperCase() || 'COLD';
  }

  async findShortestPath(start: string, end: string, maxSteps = 8): Promise<string[] | null> {
      try {
          if (!this.db) await this.init();
          
          start = start.toLowerCase();
          end = end.toLowerCase();
          if (start === end) return [start];

          let pq: { word: string, path: string[], score: number }[] = [{ word: start, path: [start], score: 0 }];
          const bestScores = new Map<string, number>();
          bestScores.set(start, 0);

          const idbWords = await this.getWordsOfLength(start.length);
          
          // Merge with in-memory words during hydration for 100% solver accuracy
          const sameLengthWords = new Set(idbWords);
          if (this.#hydrationSource) {
              Object.keys(this.#hydrationSource).forEach(w => {
                  if (w.length === start.length) sameLengthWords.add(w);
              });
          }

          while (pq.length > 0) {
              const { word: current, path, score } = pq.shift()!;

              if (path.length > maxSteps) continue;
              if (current === end) return path;

              const entry = await this.getEntry(current);
              if (!entry) continue;

              // Only consider synonyms/antonyms of the same length
              const neighbors = new Set<string>();
              [...entry.synonyms, ...entry.antonyms].forEach(w => {
                  if (w.length === current.length) neighbors.add(w);
              });
              
              if (entry.neighbors) {
                  entry.neighbors.forEach(n => neighbors.add(n));
              } else {
                  for (const candidate of sameLengthWords) {
                      if (isOneLetterDifferent(current, candidate) || isAnagram(current, candidate)) {
                          neighbors.add(candidate);
                      }
                  }
              }

              for (const neighbor of neighbors) {
                  const neighborEntry = await this.getEntry(neighbor);
                  if (!neighborEntry) continue;

                  const obscurity = calculateObscurity(neighborEntry.rank);
                  const moveScore = Math.max(10, 100 - (obscurity * 8));
                  const newScore = score + moveScore;

                  if (!bestScores.has(neighbor) || newScore < bestScores.get(neighbor)!) {
                      bestScores.set(neighbor, newScore);
                      
                      const newNode = { word: neighbor, path: [...path, neighbor], score: newScore };
                      
                      let low = 0, high = pq.length;
                      while (low < high) {
                          let mid = (low + high) >>> 1;
                          if (pq[mid].score < newScore) low = mid + 1;
                          else high = mid;
                      }
                      pq.splice(low, 0, newNode);
                  }
              }
          }
          return null;
      } catch (e) {
          console.error('[Solver] Fatal error:', e);
          return null;
      }
  }

  private async getWordsOfLength(len: number): Promise<string[]> {
      if (!this.db) await this.init();
      const tx = this.db!.transaction('dictionary', 'readonly');
      const index = tx.objectStore('dictionary').index('by-length');
      return await index.getAllKeys(len) as string[];
  }
}

export const dictionaryService = new DictionaryService();
