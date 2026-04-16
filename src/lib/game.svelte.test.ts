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

  get length() {
    return this.#store.size;
  }

  clear() {
    this.#store.clear();
  }

  getItem(key: string) {
    return this.#store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.#store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.#store.delete(key);
  }

  setItem(key: string, value: string) {
    this.#store.set(key, value);
  }
}

function installBrowserStubs(search = '') {
  const localStorage = new MemoryStorage();

  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('window', {
    location: { search, pathname: '/' },
    history: { replaceState: vi.fn() },
  });
}

function entry(word: string, overrides: Partial<Entry> = {}): Entry {
  return {
    word: word.toLowerCase(),
    synonyms: [],
    antonyms: [],
    tags: [],
    rank: 1000,
    ...overrides,
  };
}

async function loadGame(search = '') {
  installBrowserStubs(search);
  vi.resetModules();
  const mod = await import('./game.svelte');
  await Promise.resolve();
  await Promise.resolve();
  return mod.game;
}

describe('GameEngine move validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();

    dictionaryServiceMock.init.mockResolvedValue(undefined);
    dictionaryServiceMock.findShortestPath.mockResolvedValue(['cold', 'cool', 'warm']);
    dictionaryServiceMock.getRandomWord.mockImplementationOnce(async () => 'COLD');
    dictionaryServiceMock.getRandomWord.mockImplementationOnce(async () => 'WARM');
    dictionaryServiceMock.getRandomWord.mockImplementation(async () => 'COLD');
    dictionaryServiceMock.getEntry.mockImplementation(async (word: string) => {
      const normalized = word.toLowerCase();

      const entries: Record<string, Entry> = {
        cold: entry('cold', { synonyms: ['cool'], antonyms: ['warm'] }),
        cord: entry('cord'),
        clod: entry('clod'),
        cool: entry('cool'),
        warm: entry('warm'),
        heat: entry('heat', { synonyms: ['warm'] }),
        heck: entry('heck', { tags: ['profanity'] }),
      };

      return entries[normalized];
    });
  });

  it('accepts morph, anagram, synonym, and antonym moves when legal', async () => {
    const game = await loadGame();

    await expect(game.validateMove('CORD')).resolves.toMatchObject({ isValid: true, action: 'morph' });
    await expect(game.validateMove('CLOD')).resolves.toMatchObject({ isValid: true, action: 'anagram' });
    await expect(game.validateMove('COOL')).resolves.toMatchObject({ isValid: true, action: 'synonym' });
    await expect(game.validateMove('WARM')).resolves.toMatchObject({ isValid: true, action: 'antonym' });
  });

  it('rejects duplicate, wrong-length, and profanity-filtered moves', async () => {
    const game = await loadGame();

    game.history = [
      { type: 'origin', word: 'COLD', timestamp: Date.now(), obscurity: 0 },
      { type: 'waypoint', word: 'CORD', timestamp: Date.now(), obscurity: 0, action: 'morph', score: 100 },
    ];
    game.currentWord = 'CORD';

    await expect(game.validateMove('COLD')).resolves.toMatchObject({
      isValid: false,
      errors: ['"COLD" has already been used.'],
    });

    await expect(game.validateMove('HOT')).resolves.toMatchObject({
      isValid: false,
      errors: ['Word length must match the current word ("CORD" is 4 letters).'],
    });

    await expect(game.validateMove('HECK')).resolves.toMatchObject({
      isValid: false,
      errors: ['"HECK" is not in our dictionary.'],
    });
  });

  it('keeps semantic validation correct immediately after reset', async () => {
    const game = await loadGame();

    game.startWord = 'HEAT';
    game.currentWord = 'COLD';
    game.history = [{ type: 'origin', word: 'COLD', timestamp: Date.now(), obscurity: 0 }];

    game.reset();

    await expect(game.validateMove('WARM')).resolves.toMatchObject({ isValid: true, action: 'synonym' });
  });

  it('prevents two concurrent moves from applying against the same prior state', async () => {
    const game = await loadGame();

    const [firstApplied, secondApplied] = await Promise.all([
      game.makeMove('CORD'),
      game.makeMove('COOL'),
    ]);

    expect([firstApplied, secondApplied].filter(Boolean)).toHaveLength(1);
    expect(game.history).toHaveLength(2);
    expect(game.history[1].word).toBe('CORD');
    expect(game.currentWord).toBe('CORD');
  });

  it('passes profanity and history constraints into solver pathfinding', async () => {
    const game = await loadGame();

    game.allowProfanity = true;
    game.history = [
      { type: 'origin', word: 'COLD', timestamp: Date.now(), obscurity: 0 },
      { type: 'waypoint', word: 'CORD', timestamp: Date.now(), obscurity: 0, action: 'morph', score: 100 },
    ];
    game.currentWord = 'CORD';
    game.finishWord = 'WARM';

    dictionaryServiceMock.findShortestPath.mockResolvedValueOnce(['cord', 'warm']);

    await game.solve();

    expect(dictionaryServiceMock.findShortestPath).toHaveBeenCalledWith('CORD', 'WARM', 10, {
      allowProfanity: true,
      usedWords: ['COLD', 'CORD'],
    });
  });

  it('passes profanity settings into random journey generation', async () => {
    const game = await loadGame();

    game.allowProfanity = true;
    dictionaryServiceMock.findShortestPath.mockClear();
    dictionaryServiceMock.getRandomWord.mockImplementationOnce(async () => 'COLD');
    dictionaryServiceMock.getRandomWord.mockImplementationOnce(async () => 'WARM');
    dictionaryServiceMock.findShortestPath.mockResolvedValueOnce(['cold', 'cool', 'warm']);

    await game.loadRandomJourney();

    expect(dictionaryServiceMock.findShortestPath).toHaveBeenCalledWith('COLD', 'WARM', 6, {
      allowProfanity: true,
    });
  });
});
