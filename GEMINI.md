# Project Mandates: Word Connection

This file contains foundational rules and architectural decisions for the Word Connection project.

## Core Logic Rules
- **Offline-First Validation**: All moves MUST be validated against the local IndexedDB dictionary. External APIs are only used for initial hydration.
- **Valid Move Criteria**:
  - **Morph**: Single letter change, length must match.
  - **Anagram**: Rearrange letters, length must match.
  - **Semantic**: Synonyms or Antonyms as defined in the local dictionary.
- **Content Filtering**: All words MUST pass the `allowProfanity` check (toggled in settings) by inspecting the `tags` array in the dictionary.
- **Move History**: Maintain a full path to prevent loops and show progress.

## Technical Standards
- **Svelte 5 + TypeScript**: Use Runes (`$state`, `$derived`, `$effect`) for all reactive logic. Encapsulate core logic in the `GameEngine` class.
- **IndexedDB**: Use `idb` for persistent, high-volume word storage (~150k+ words).
- **Tailwind CSS 4**: Follow utility-first styling with a focus on consistent, standard card dimensions and responsive design.
- **Performance**: Move validation must be synchronous (using pre-fetched turn data) to ensure a "snappy" input feel.

## Architectural Direction
- **DictionaryService**: Manages DB hydration, indexing, and lookup logic.
- **GameEngine**: Centralized state manager using Svelte 5 Runes. Handles turn-based pre-fetching of semantic connections.
- **UI Components**: `App.svelte` should remain focused on presentation, delegating all validation and state transitions to the `GameEngine`.
