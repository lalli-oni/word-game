import { openDB, type IDBPDatabase } from 'idb';

export interface DictionaryEntry {
  word: string;
  synonyms: string[];
  antonyms: string[];
  tags: string[];
}

class DictionaryService {
  private dbName = 'WordConnectionDB';
  private dbVersion = 1;
  private db: IDBPDatabase | null = null;
  
  // Use Svelte 5 runes for reactive hydration state
  status = $state<'idle' | 'hydrating' | 'ready' | 'error'>('idle');
  progress = $state(0);

  async init() {
    if (this.db) return;

    try {
        this.db = await openDB(this.dbName, this.dbVersion, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('dictionary')) {
              const store = db.createObjectStore('dictionary', { keyPath: 'word' });
              store.createIndex('by-tag', 'tags', { multiEntry: true });
            }
          },
        });

        const count = await this.db.count('dictionary');
        if (count === 0) {
          await this.hydrate();
        } else {
          this.status = 'ready';
        }
    } catch (e) {
        this.status = 'error';
        console.error('DB Init failed:', e);
    }
  }

  private async hydrate() {
    this.status = 'hydrating';
    this.progress = 0;
    console.log('Hydrating dictionary into IndexedDB...');

    try {
      const response = await fetch('/word-game/dictionary.json');
      if (!response.ok) throw new Error('Failed to fetch dictionary.json');
      
      const data = await response.json();
      const words = Object.keys(data);
      const total = words.length;
      
      const tx = this.db!.transaction('dictionary', 'readwrite');
      const store = tx.objectStore('dictionary');

      let current = 0;
      for (const word of words) {
        await store.put({
          word,
          ...data[word]
        });
        current++;
        if (current % 1000 === 0) {
            this.progress = Math.round((current / total) * 100);
        }
      }

      await tx.done;
      this.status = 'ready';
      console.log(`Successfully hydrated ${words.length} words.`);
    } catch (error) {
      this.status = 'error';
      console.error('Hydration failed:', error);
    }
  }

  async getEntry(word: string): Promise<DictionaryEntry | undefined> {
    if (!this.db) await this.init();
    return await this.db!.get('dictionary', word.toLowerCase());
  }

  async checkExists(word: string): Promise<boolean> {
    const entry = await this.getEntry(word);
    return !!entry;
  }
}

export const dictionaryService = new DictionaryService();
