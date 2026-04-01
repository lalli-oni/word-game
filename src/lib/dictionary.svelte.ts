import { openDB, type IDBPDatabase } from 'idb';

export interface DictionaryEntry {
  word: string;
  synonyms: string[];
  antonyms: string[];
  tags: string[];
  rank: number;
}

class DictionaryService {
  private dbName = 'WordConnectionDB';
  private dbVersion = 3;
  private db: IDBPDatabase | null = null;
  
  status = $state<'idle' | 'hydrating' | 'ready' | 'error'>('idle');
  progress = $state(0);
  errorMessage = $state<string | null>(null);

  async init() {
    if (this.db) return;

    try {
        console.log('[IDB] Initializing...');
        this.db = await openDB(this.dbName, this.dbVersion, {
          upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`[IDB] Upgrade: ${oldVersion} -> ${newVersion}`);
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
        const sample = count > 0 ? await this.db.get('dictionary', 'cold') : null;
        
        if (count === 0 || (sample && sample.length === undefined)) {
          await this.hydrate();
        } else {
          this.status = 'ready';
        }
    } catch (e: any) {
        this.status = 'error';
        this.errorMessage = e.message || 'Unknown database error';
        console.error('[IDB] Init error:', e);
        throw e;
    }
  }

  private async hydrate() {
    this.status = 'hydrating';
    this.progress = 0;
    this.errorMessage = null;

    try {
      const response = await fetch('dictionary.json');
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const data = await response.json();
      const words = Object.keys(data);
      const total = words.length;
      
      const tx = this.db!.transaction('dictionary', 'readwrite');
      const store = tx.objectStore('dictionary');

      let current = 0;
      for (const word of words) {
        await store.put({
          word,
          length: word.length,
          ...data[word]
        });
        current++;
        if (current % 2000 === 0) {
            this.progress = Math.round((current / total) * 100);
        }
      }

      await tx.done;
      this.status = 'ready';
    } catch (error: any) {
      this.status = 'error';
      this.errorMessage = error.message;
      throw error;
    }
  }

  async getEntry(word: string): Promise<DictionaryEntry | undefined> {
    if (!this.db) await this.init();
    return await this.db!.get('dictionary', word.toLowerCase());
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

  async findShortestPath(start: string, end: string, maxSteps = 6): Promise<string[] | null> {
      try {
          console.log(`[Solver] Searching path: ${start} -> ${end} (max ${maxSteps} steps)`);
          if (!this.db) await this.init();
          
          start = start.toLowerCase();
          end = end.toLowerCase();
          if (start === end) return [start];

          const queue: [string, string[]][] = [[start, [start]]];
          const visited = new Set([start]);

          const sameLengthWords = await this.getWordsOfLength(start.length);
          console.log(`[Solver] Found ${sameLengthWords.length} words of length ${start.length} for structural checks.`);

          while (queue.length > 0) {
              const [current, path] = queue.shift()!;
              if (path.length > maxSteps) continue;

              const entry = await this.getEntry(current);
              if (!entry) continue;

              const neighbors = new Set([
                  ...entry.synonyms,
                  ...entry.antonyms
              ]);

              for (const candidate of sameLengthWords) {
                  if (candidate === current) continue;
                  if (this.isOneLetterDifferent(current, candidate) || this.isAnagram(current, candidate)) {
                      neighbors.add(candidate);
                  }
              }

              for (const neighbor of neighbors) {
                  if (neighbor === end) {
                      const finalPath = [...path, neighbor];
                      console.log(`[Solver] Success! Path found: ${finalPath.join(' -> ')}`);
                      return finalPath;
                  }
                  if (!visited.has(neighbor)) {
                      visited.add(neighbor);
                      queue.push([neighbor, [...path, neighbor]]);
                  }
              }
          }
          console.warn(`[Solver] No path found between ${start} and ${end} within ${maxSteps} steps.`);
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

  private isOneLetterDifferent(w1: string, w2: string): boolean {
      if (w1.length !== w2.length) return false;
      let diffs = 0;
      for (let i = 0; i < w1.length; i++) {
          if (w1[i] !== w2[i]) diffs++;
          if (diffs > 1) return false;
      }
      return diffs === 1;
  }

  private isAnagram(w1: string, w2: string): boolean {
      if (w1.length !== w2.length || w1 === w2) return false;
      return w1.split('').sort().join('') === w2.split('').sort().join('');
  }
}

export const dictionaryService = new DictionaryService();
