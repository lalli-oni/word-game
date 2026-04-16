# Word Connection

A multidimensional word puzzle game where you navigate from a Start Word to a Finish Word using spelling, structure, and meaning.

## Game Overview
In **Word Connection**, your goal is to find the shortest path between two unrelated words. Unlike traditional word games that lock you into a single mechanic, this game allows you to "teleport" through the dictionary using multiple types of connections:

- **Letter Change**: Change exactly one letter (e.g., COLD → CORD).
- **Anagram**: Rearrange the characters (e.g., ARC → CAR).
- **Synonym**: Move to a word with the same meaning (e.g., HAPPY → GLAD).
- **Antonym**: Move to a word with the opposite meaning (e.g., COLD → HOT).

## Project Philosophy
This game is designed to challenge both the linguistic and logical parts of the brain simultaneously. For a deep dive into why we built this and how it differs from other word games, see [PHILOSOPHY.md](./PHILOSOPHY.md).

## Getting Started
1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173` (or the port shown in your terminal).

## Testing
The test setup is intentionally small right now. We currently have low-level unit coverage around the game engine, focused on move validation rules and the async turn-flow edges that are easiest to regress.

- Run the unit suite with `npm test`
- Run type checks with `npm run check`

### Testing Strategy
We are starting at the engine and service layer because that is where rule correctness lives: move legality, duplicate prevention, profanity filtering, and turn sequencing. That gives us fast feedback on the core puzzle logic before we expand outward.

The next step is broader low-level coverage for dictionary and solver behavior so generation and auto-solve stay aligned with live move validation. After that, we can add a small number of end-to-end tests to cover the full browser flow and verify that the UI wiring matches the engine guarantees.

## Tech Stack
- **Frontend**: Svelte 5 + TypeScript
- **Styling**: Tailwind CSS 4
- **API**: Free Dictionary API for semantic validation.
