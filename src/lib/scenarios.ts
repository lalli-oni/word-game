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
  }
];
