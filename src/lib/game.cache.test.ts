import { beforeEach, describe, expect, it, vi } from 'vitest';

type Entry = {
  word: string;
  synonyms: string[];
  antonyms: string[];
  tags: string[];
  rank: number;
};

const dictionaryServiceMock = vi.hoisted(() => ({
  init: vi.fn<() => Promise<void>>(),
  getEntry: vi.fn<(word: string) => Promise<Entry | undefined>>(),
  findShortestPath: vi.fn(),
  getRandomWord: vi.fn(),
}));

vi.mock('./dictionary.svelte', () => ({
  dictionaryService: dictionaryServiceMock,
}));

class MemoryStorage implements Storage {
  #store = new Map<string, string>();
  get length() { return this.#store.size; }
  clear() { this.#store.clear(); }
  getItem(key: string) { return this.#store.get(key) ?? null; }
  key(index: number) { return Array.from(this.#store.keys())[index] ?? null; }
  removeItem(key: string) { this.#store.delete(key); }
  setItem(key: string, value: string) { this.#store.set(key, value); }
}

function installBrowserStubs(search = '') {
  const localStorage = new MemoryStorage();
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('window', {
    location: { search, pathname: '/' },
    history: { replaceState: vi.fn() },
  });
}

async function loadGame(search = '') {
  installBrowserStubs(search);
  vi.resetModules();
  const mod = await import('./game.svelte');
  await Promise.resolve();
  await Promise.resolve();
  return mod.game;
}

describe('GameEngine hint cache behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();

    dictionaryServiceMock.init.mockResolvedValue(undefined);
    dictionaryServiceMock.getRandomWord.mockResolvedValue('COLD');
    dictionaryServiceMock.getEntry.mockImplementation(async (word: string) => ({
      word: word.toLowerCase(),
      synonyms: [],
      antonyms: [],
      tags: [],
      rank: 1000,
    }));
  });

  it('caches full solution and uses cache on subsequent calls', async () => {
    const game = await loadGame();
    dictionaryServiceMock.findShortestPath.mockResolvedValue(['cold', 'cool', 'warm']);

    const p1 = await game.getFullSolution('COLD', 'WARM');
    expect(dictionaryServiceMock.findShortestPath).toHaveBeenCalledTimes(1);
    expect(p1).toEqual(['cold', 'cool', 'warm']);

    const p2 = await game.getFullSolution('COLD', 'WARM');
    // still only one underlying solver call
    expect(dictionaryServiceMock.findShortestPath).toHaveBeenCalledTimes(1);
    expect(p2).toEqual(p1);
  });

  it('invalidates cache when player deviates from cached path', async () => {
    const game = await loadGame();
    // initial canonical path
    dictionaryServiceMock.findShortestPath.mockResolvedValueOnce(['cold', 'cool', 'warm']);

    const sol = await game.getFullSolution('COLD', 'WARM');
    expect(sol?.[1]).toBe('cool');
    expect(game.hasCachedSolution()).toBe(true);

    // Player deviates by making a different valid move (CORD)
    // ensure subsequent solver call will be invoked for new context
    dictionaryServiceMock.findShortestPath.mockResolvedValueOnce(['cord', 'warm']);

    const applied = await game.makeMove('CORD');
    expect(applied).toBe(true);

    // cache should have been invalidated due to deviation
    expect(game.hasCachedSolution()).toBe(false);

    // asking for a solution from current state should trigger new solver call
    const newSol = await game.getFullSolution('CORD', 'WARM');
    expect(dictionaryServiceMock.findShortestPath).toHaveBeenCalled();
    expect(newSol).toEqual(['cord', 'warm']);
  });

  it('deduplicates concurrent solver calls (in-flight requests)', async () => {
    const game = await loadGame();

    let resolver: (v: string[] | null) => void;
    const p = new Promise<string[] | null>((res) => { resolver = res; });
    // first call returns the pending promise
    dictionaryServiceMock.findShortestPath.mockImplementation(() => p as any);

    // start two concurrent requests
    const a = game.getFullSolution('COLD', 'WARM');
    const b = game.getFullSolution('COLD', 'WARM');

    // underlying solver should have been invoked exactly once so far
    expect(dictionaryServiceMock.findShortestPath).toHaveBeenCalledTimes(1);

    // resolve the underlying promise
    resolver!(['cold', 'cool', 'warm']);

    const [ra, rb] = await Promise.all([a, b]);
    expect(ra).toEqual(['cold', 'cool', 'warm']);
    expect(rb).toEqual(['cold', 'cool', 'warm']);

    // still only one underlying invocation
    expect(dictionaryServiceMock.findShortestPath).toHaveBeenCalledTimes(1);
  });

});
