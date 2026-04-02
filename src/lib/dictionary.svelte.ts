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
        this.db = await openDB(this.dbName, this.dbVersion, {
          upgrade(db, oldVersion, newVersion, transaction) {
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
        
        // Rigorous Health Check: 
        // 1. Must have data
        // 2. Sample must have 'rank' (v3)
        // 3. Sample must have 'synonyms' or 'antonyms' array (integrity)
        const isHealthy = sample && 
                         sample.rank !== undefined && 
                         Array.isArray(sample.synonyms);

        if (count === 0 || !isHealthy) {
          console.warn('[IDB] Database unhealthy or missing semantic data. Re-hydrating...');
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

  async findShortestPath(start: string, end: string, maxSteps = 8): Promise<string[] | null> {
      try {
          if (!this.db) await this.init();
          
          start = start.toLowerCase();
          end = end.toLowerCase();
          if (start === end) return [start];

          let pq: { word: string, path: string[], score: number }[] = [{ word: start, path: [start], score: 0 }];
          const bestScores = new Map<string, number>();
          bestScores.set(start, 0);

          const sameLengthWords = await this.getWordsOfLength(start.length);

          while (pq.length > 0) {
              const { word: current, path, score } = pq.shift()!;

              if (path.length > maxSteps) continue;
              if (current === end) return path;

              const entry = await this.getEntry(current);
              if (!entry) continue;

              const neighbors = new Set([...entry.synonyms, ...entry.antonyms]);
              for (const candidate of sameLengthWords) {
                  if (this.isOneLetterDifferent(current, candidate) || this.isAnagram(current, candidate)) {
                      neighbors.add(candidate);
                  }
              }

              for (const neighbor of neighbors) {
                  const neighborEntry = await this.getEntry(neighbor);
                  if (!neighborEntry) continue;

                  const obscurity = this.calculateObscurity(neighborEntry.rank);
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

  private calculateObscurity(rank: number): number {
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
