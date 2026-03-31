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
  private dbVersion = 2; // Keep at 2 for now, or bump if schema changed significantly
  private db: IDBPDatabase | null = null;
  
  status = $state<'idle' | 'hydrating' | 'ready' | 'error'>('idle');
  progress = $state(0);
  errorMessage = $state<string | null>(null);

  async init() {
    if (this.db) return;

    try {
        console.log('Initializing IndexedDB...');
        this.db = await openDB(this.dbName, this.dbVersion, {
          upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`Upgrading DB from ${oldVersion} to ${newVersion}`);
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
        console.log(`Current word count in DB: ${count}`);
        
        // Safety check for schema fields
        const sample = count > 0 ? await this.db.get('dictionary', 'cold') : null;
        
        if (count === 0 || (sample && sample.length === undefined)) {
          console.log('DB empty or schema outdated. Starting hydration...');
          await this.hydrate();
        } else {
          this.status = 'ready';
        }
    } catch (e: any) {
        this.status = 'error';
        this.errorMessage = e.message || 'Unknown database error';
        console.error('DB Init failed:', e);
        throw e; // Bubble up
    }
  }

  private async hydrate() {
    this.status = 'hydrating';
    this.progress = 0;
    this.errorMessage = null;

    try {
      console.log('Fetching dictionary.json...');
      const response = await fetch('dictionary.json');
      if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      const words = Object.keys(data);
      const total = words.length;
      console.log(`Fetched ${total} words. Starting IDB transaction...`);
      
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
            // Non-blocking progress update might be needed for smoother UI
        }
      }

      await tx.done;
      this.status = 'ready';
      console.log(`Successfully hydrated ${words.length} words.`);
    } catch (error: any) {
      this.status = 'error';
      this.errorMessage = error.message || 'Hydration failed';
      console.error('Hydration failed:', error);
      throw error;
    }
  }

  async getEntry(word: string): Promise<DictionaryEntry | undefined> {
    if (this.status === 'error') throw new Error(this.errorMessage || 'Dictionary error');
    if (!this.db) await this.init();
    return await this.db!.get('dictionary', word.toLowerCase());
  }

  async checkExists(word: string): Promise<boolean> {
    const entry = await this.getEntry(word);
    return !!entry;
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

  async areConnected(start: string, end: string, maxDepth = 3): Promise<boolean> {
      if (start === end) return true;
      
      let queue = [start.toLowerCase()];
      let visited = new Set([start.toLowerCase()]);
      
      for (let depth = 0; depth < maxDepth; depth++) {
          const nextQueue = [];
          for (const current of queue) {
              const entry = await this.getEntry(current);
              if (!entry) continue;

              const neighbors = new Set([...entry.synonyms, ...entry.antonyms]);

              for (const neighbor of neighbors) {
                  if (neighbor === end.toLowerCase()) return true;
                  if (!visited.has(neighbor)) {
                      visited.add(neighbor);
                      nextQueue.push(neighbor);
                  }
              }
          }
          queue = nextQueue;
          if (queue.length === 0) break;
      }
      return false;
  }
}

export const dictionaryService = new DictionaryService();
