/**
 * Tests for DictionaryService hint-finding helpers.
 * Mocks: dictionary JSON hydration and IDB interactions are stubbed.
 */
import { describe, expect, it, vi } from 'vitest';
import { DictionaryService } from './dictionary.svelte';

describe('DictionaryService (no internal cache)', () => {
  it('calls findShortestPath on each getFullSolution/getHint invocation', async () => {
    const service = new DictionaryService() as any;
    service.findShortestPath = vi.fn(async () => ['cold', 'heck', 'warm']);

    const full = await service.getFullSolution('COLD', 'WARM', {});
    expect(full).toEqual(['cold', 'heck', 'warm']);
    expect(service.findShortestPath).toHaveBeenCalledTimes(1);

    const hint = await service.getHint('COLD', 'WARM', {});
    expect(hint).toBe('heck');
    // No caching at DictionaryService level, so findShortestPath called again
    expect(service.findShortestPath).toHaveBeenCalledTimes(2);
  });

  it('reflects updated solver results on subsequent calls', async () => {
    const service = new DictionaryService() as any;
    service.findShortestPath = vi.fn(async () => ['cold', 'heck', 'warm']);
    await service.getFullSolution('COLD', 'WARM', {});

    service.findShortestPath = vi.fn(async () => ['cold', 'cord', 'warm']);
    const hint = await service.getHint('COLD', 'WARM', {});
    expect(hint).toBe('cord');
    expect(service.findShortestPath).toHaveBeenCalledTimes(1);
  });
});
