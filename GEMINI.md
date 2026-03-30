# Project Mandates: Word Connection

This file contains foundational rules and architectural decisions for the Word Connection project.

## Core Logic Rules
- All moves MUST be validated against a word list or API.
- A move is valid ONLY if it meets one of these criteria:
  - Single letter change (preserving word length).
  - Synonym of the current word.
  - Antonym of the current word.
- The game MUST maintain a history of all moves to prevent loops and show progress.

## Technical Standards
- **Svelte + TypeScript**: All components and logic must be strictly typed.
- **Tailwind CSS**: Use utility classes for styling. Follow a mobile-first design.
- **Accessibility**: Ensure the game is playable with a keyboard and screen readers.
- **Performance**: Cache API results for synonyms/antonyms to reduce latency.

## Architectural Direction
- Separate game logic (Svelte Stores) from UI components.
- Use a central `GameEngine` or similar abstraction to handle word validation and state transitions.
