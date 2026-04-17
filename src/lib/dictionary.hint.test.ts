import { describe, expect, it, vi } from 'vitest';
import { DictionaryService } from './dictionary.svelte';

describe('DictionaryService hint persistence', () => {
  it('returns next node from same cached solution and avoids recomputing', async () => {
    const service = new DictionaryService() as any;
    service.findShortestPath = vi.fn(async () => ['cold', 'heck', 'warm']);

    const full = await service.getFullSolution('COLD', 'WARM', {});
    expect(full).toEqual(['cold', 'heck', 'warm']);
    expect(service.findShortestPath).toHaveBeenCalledTimes(1);

    const hint = await service.getHint('COLD', 'WARM', {});
    expect(hint).toBe('heck');
    expect(service.findShortestPath).toHaveBeenCalledTimes(1);
  });

  it('recomputes solution after invalidation or deviation', async () => {
    const service = new DictionaryService() as any;
    service.findShortestPath = vi.fn(async () => ['cold', 'heck', 'warm']);
    await service.getFullSolution('COLD', 'WARM', {});

    service.invalidateCachedSolution();

    service.findShortestPath = vi.fn(async () => ['cold', 'cord', 'warm']);
    const hint = await service.getHint('COLD', 'WARM', {});
    expect(hint).toBe('cord');
    expect(service.findShortestPath).toHaveBeenCalledTimes(1);
  });
});
