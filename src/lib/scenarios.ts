export interface Scenario {
  id: string;
  name: string;
  startWord: string;
  finishWord: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description?: string;
}

export const scenarios: Scenario[] = [
  {
    id: 'tutorial',
    name: 'The Basics',
    startWord: 'COLD',
    finishWord: 'WARM',
    difficulty: 'easy',
    description: 'A simple start. Can you find a shortcut using an antonym?'
  },
  {
    id: 'land-sea',
    name: 'Land to Sea',
    startWord: 'LAND',
    finishWord: 'SHIP',
    difficulty: 'medium',
    description: 'Navigate from the ground to the ocean.'
  },
  {
    id: 'cat-dog',
    name: 'Classic Ladder',
    startWord: 'CAT',
    finishWord: 'DOG',
    difficulty: 'medium',
    description: 'The classic word ladder challenge.'
  },
  {
    id: 'fire-ice',
    name: 'Elemental Path',
    startWord: 'FIRE',
    finishWord: 'SNOW',
    difficulty: 'hard',
    description: 'From heat to freezing cold.'
  },
  {
    id: 'work-play',
    name: 'Life Balance',
    startWord: 'WORK',
    finishWord: 'PLAY',
    difficulty: 'medium',
    description: 'Find the path between professional and personal.'
  },
  {
    id: 'night-dawn',
    name: 'Morning Routine',
    startWord: 'DARK',
    finishWord: 'LIGHT',
    difficulty: 'easy',
    description: 'A simple transition from dark to light.'
  },
  {
    id: 'space-moon',
    name: 'Astro Jump',
    startWord: 'STAR',
    finishWord: 'MOON',
    difficulty: 'hard',
    description: 'Navigate the cosmic ladder.'
  }
];
