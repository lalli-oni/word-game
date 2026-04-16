import { describe, expect, it, vi } from 'vitest';

import { DictionaryService, type DictionaryEntry } from './dictionary.svelte';

function entry(word: string, overrides: Partial<DictionaryEntry> = {}): DictionaryEntry {
  return {
    word: word.toLowerCase(),
    synonyms: [],
    antonyms: [],
    tags: [],
    rank: 1000,
    ...overrides,
  };
}

describe('DictionaryService pathfinding', () => {
  it('honors profanity and used-word constraints when searching for a path', async () => {
    const service = new DictionaryService() as any;

    service.db = {};
    service.getWordsOfLength = vi.fn(async () => ['cord', 'heck', 'warm']);
    service.getEntry = vi.fn(async (word: string) => {
      const entries: Record<string, DictionaryEntry> = {
        cold: entry('cold', { neighbors: ['cord', 'heck'] }),
        cord: entry('cord', { neighbors: ['warm'] }),
        heck: entry('heck', { neighbors: ['warm'], tags: ['profanity'] }),
        warm: entry('warm'),
      };

      return entries[word.toLowerCase()];
    });

    await expect(
      service.findShortestPath('COLD', 'WARM', 4, { allowProfanity: false, usedWords: ['CORD'] })
    ).resolves.toBeNull();

    await expect(
      service.findShortestPath('COLD', 'WARM', 4, { allowProfanity: true, usedWords: ['CORD'] })
    ).resolves.toEqual(['cold', 'heck', 'warm']);
  });
});
