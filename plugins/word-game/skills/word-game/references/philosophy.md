# Word Connection Philosophy

Use this reference when a task depends on the intended player experience rather than only implementation details.

## Product intent

Word Connection is a multidimensional word puzzle. The player navigates between words using a mix of:

- structural moves: one-letter morphs
- anagram moves: same letters, new arrangement
- semantic moves: synonyms and antonyms

The design goal is not just vocabulary recall. The game should make players switch between structural and semantic reasoning to find bridges through the language graph.

## Why this matters in implementation

- Semantic moves act like shortcuts that open new structural opportunities.
- The puzzle should feel like navigation through connected words, not isolated minigames.
- Multiple valid routes should remain possible; avoid changes that over-constrain the path space without a clear product reason.

## Comparison baseline

- Word ladders cover only the structural layer.
- Anagram games isolate rearrangement as the whole puzzle.
- Semantic guessing games focus on meaning distance rather than discrete moves.
- This project combines those dimensions into a shortest-path navigation challenge.
