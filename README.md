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

## Tech Stack
- **Frontend**: Svelte 5 + TypeScript
- **Styling**: Tailwind CSS 4
- **API**: Free Dictionary API for semantic validation.
