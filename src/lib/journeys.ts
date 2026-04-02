export interface Journey {
  id: string;
  name: string;
  startWord: string;
  finishWord: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description?: string;
  tags?: string[];
}

export const journeys: Journey[] = [
  {
    id: 'tutorial',
    name: 'The First Steps',
    startWord: 'COLD',
    finishWord: 'WARM',
    difficulty: 'easy',
    description: 'A simple start. Can you find a shortcut using an antonym?'
  },
  {
    id: 'fast-slow',
    name: 'Quick Motion',
    startWord: 'FAST',
    finishWord: 'SLOW',
    difficulty: 'easy',
    description: 'A simple speed transition.'
  },
  {
    id: 'night-dawn',
    name: 'Break of Day',
    startWord: 'DARK',
    finishWord: 'LIGHT',
    difficulty: 'easy',
    description: 'A simple transition from dark to light.'
  },
  {
    id: 'love-hate',
    name: 'Emotional Pendulum',
    startWord: 'LOVE',
    finishWord: 'HATE',
    difficulty: 'medium',
    description: 'The distance between strong feelings.'
  },
  {
    id: 'land-sea',
    name: 'Coast to Coast',
    startWord: 'LAND',
    finishWord: 'SHIP',
    difficulty: 'medium',
    description: 'Navigate from the ground to the ocean.'
  },
  {
    id: 'cat-dog',
    name: 'Classic Trek',
    startWord: 'CAT',
    finishWord: 'DOG',
    difficulty: 'medium',
    description: 'The classic word ladder challenge.'
  },
  {
    id: 'work-play',
    name: 'The Daily Loop',
    startWord: 'WORK',
    finishWord: 'PLAY',
    difficulty: 'medium',
    description: 'Find the path between professional and personal.'
  },
  {
    id: 'king-queen',
    name: 'Royal Decree',
    startWord: 'KING',
    finishWord: 'QUEEN',
    difficulty: 'medium',
    description: 'Ascend the throne.'
  },
  {
    id: 'good-evil',
    name: 'Moral Compass',
    startWord: 'GOOD',
    finishWord: 'EVIL',
    difficulty: 'hard',
    description: 'Navigate the complex path of morality.'
  },
  {
    id: 'fire-ice',
    name: 'Elemental Quest',
    startWord: 'FIRE',
    finishWord: 'SNOW',
    difficulty: 'hard',
    description: 'From heat to freezing cold.'
  },
  {
    id: 'space-moon',
    name: 'Cosmic Voyage',
    startWord: 'STAR',
    finishWord: 'MOON',
    difficulty: 'hard',
    description: 'Navigate the cosmic ladder.'
  },
  {
    id: 'life-death',
    name: 'The Great Cycle',
    startWord: 'LIFE',
    finishWord: 'DEAD',
    difficulty: 'hard',
    description: 'Explore the journey of existence.'
  },
  {
    id: 'heart-brain',
    name: 'Logic vs Passion',
    startWord: 'HEART',
    finishWord: 'BRAIN',
    difficulty: 'hard',
    description: 'Connect the two engines of the human experience.'
  },
  // Profane scenarios
  {
    id: 'dirty-1',
    name: 'Urban Grime',
    startWord: 'CLEAN',
    finishWord: 'SHIT',
    difficulty: 'medium',
    tags: ['profanity'],
    description: 'A messy descent into the urban dictionary.'
  },
  {
    id: 'dirty-2',
    name: 'The Roast',
    startWord: 'NICE',
    finishWord: 'DICK',
    difficulty: 'hard',
    tags: ['profanity'],
    description: 'From compliments to... something else.'
  },
  {
    id: 'dirty-3',
    name: 'Expletive Deleted',
    startWord: 'HELL',
    finishWord: 'FUCK',
    difficulty: 'hard',
    tags: ['profanity'],
    description: 'The most direct path between frustrations.'
  }
];
