# Implementation Plan: Dictionary Optimization

Goal: Reduce `dictionary.json` size (~14.6MB) and improve IndexedDB hydration speed.

## Task 1: Binary Serialization (MessagePack)
- Replace `JSON.stringify` in `scripts/build-dictionary.cjs` with a binary encoder.
- **Tool**: `msgpack-lite` or `@msgpack/msgpack`.
- **UI Changes**: Update `DictionaryService.ts` to fetch as an `arrayBuffer` and decode.

## Task 2: Chunked IndexedDB Ingestion
- Currently, the app does one massive transaction for all words.
- **Action**: Split the hydration into batches of 5,000 words. 
- Use `requestIdleCallback` or `setTimeout(0)` between batches to keep the UI responsive.

## Task 3: Adjacency List Pre-calculation
- For words with a rank < 20,000 (the most common ones), pre-calculate one-letter-different neighbors during the build step.
- This will make the "Magic Path" solver nearly instantaneous for common words.

## Verification
- Measure `dictionary.json` size reduction.
- Profile "Time to Ready" in the browser console.
- Ensure all game logic (validation, anagrams, synonyms) still functions correctly.
