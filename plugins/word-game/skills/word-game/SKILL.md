---
name: word-game
description: Repo-specific guidance for the Word Connection codebase. Use when Codex works in this repository, especially on game rules, dictionary hydration, move validation, scoring, Svelte 5 runes, IndexedDB data flow, or UI changes that must preserve the current architecture.
---

# Word Game

Treat this repository as a Svelte 5 + TypeScript game with strict game-logic constraints. Preserve the existing architectural split between presentation and engine code.

## Core rules

- Keep move validation offline-first. Validate against the local IndexedDB-backed dictionary, not a live API.
- Preserve the three valid move classes:
  - morph: exactly one letter changes and word length stays the same
  - anagram: letters rearrange and word length stays the same
  - semantic: synonym or antonym present in the local dictionary entry
- Respect content filtering through the dictionary entry `tags` array and the `allowProfanity` setting.
- Maintain full move history so loops are blocked and the path remains visible to the player.

## Architecture

- Keep the stateful game logic in [`src/lib/game.svelte.ts`](/Users/larusjohannsson/Developer/word-game/src/lib/game.svelte.ts) and treat `GameEngine` as the source of truth for turn flow, persistence, solving, and scoring.
- Keep dictionary hydration, lookup, and path-finding responsibilities in [`src/lib/dictionary.svelte.ts`](/Users/larusjohannsson/Developer/word-game/src/lib/dictionary.svelte.ts).
- Keep [`src/App.svelte`](/Users/larusjohannsson/Developer/word-game/src/App.svelte) presentation-focused. UI components can orchestrate local display state, but validation and state transitions should stay in the engine/services layer.
- Follow the existing Svelte 5 runes style (`$state`, `$derived`, `$effect`) instead of introducing older store patterns unless the codebase already uses them in the touched area.

## Working style

- Preserve the snappy input path. Avoid changes that make move validation depend on network access or large async work at submit time.
- Prefer incremental changes that fit the current code shape over broad rewrites.
- When touching game rules, check both the immediate validation behavior and the downstream effects on scoring, journey generation, and persistence.
- When touching dictionary hydration, preserve the "priority words first, standard batches after" behavior so the app becomes playable before the full dataset finishes loading.

## Validation

- Run `npm run check` after code changes when possible.
- For game-logic edits, read the relevant engine and dictionary files together before modifying behavior.
- Use [`GEMINI.md`](/Users/larusjohannsson/Developer/word-game/GEMINI.md) as the high-signal project mandate.
- Read [`references/philosophy.md`](./references/philosophy.md) only when product intent or puzzle design matters to the change.
