export interface Journey {
  id: string;
  name: string;
  startWord: string;
  finishWord: string;
  difficulty: 'easy' | 'medium' | 'hard';
  optimalScore?: number;
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
    optimalScore: 192,
    description: 'A simple start. Can you find a shortcut using an antonym?'
  },
  {
    id: 'fast-slow',
    name: 'Delayed Motion',
    startWord: 'FAST',
    finishWord: 'LATE',
    difficulty: 'medium',
    optimalScore: 200,
    description: 'A speed change that takes more than one hop.'
  },
  {
    id: 'night-dawn',
    name: 'Break of Day',
    startWord: 'DARK',
    finishWord: 'GLOW',
    difficulty: 'medium',
    optimalScore: 212,
    description: 'A transition from darkness toward light.'
  },
  {
    id: 'love-hate',
    name: 'Emotional Pendulum',
    startWord: 'LOVE',
    finishWord: 'CARE',
    difficulty: 'medium',
    optimalScore: 208,
    description: 'The distance between strong feelings and concern.'
  },
  {
    id: 'land-sea',
    name: 'Coast to Coast',
    startWord: 'LAND',
    finishWord: 'SHIP',
    difficulty: 'medium',
    optimalScore: 292,
    description: 'Navigate from the ground to the ocean.'
  },
  {
    id: 'cat-dog',
    name: 'Classic Trek',
    startWord: 'CAT',
    finishWord: 'DOG',
    difficulty: 'medium',
    optimalScore: 176,
    description: 'The classic word ladder challenge.'
  },
  {
    id: 'work-play',
    name: 'The Daily Loop',
    startWord: 'WORK',
    finishWord: 'REST',
    difficulty: 'medium',
    optimalScore: 284,
    description: 'Find the path between effort and recovery.'
  },
  {
    id: 'king-queen',
    name: 'Royal Decree',
    startWord: 'KING',
    finishWord: 'DUKE',
    difficulty: 'medium',
    optimalScore: 272,
    description: 'Ascend the throne without taking the obvious route.'
  },
  {
    id: 'good-evil',
    name: 'Moral Compass',
    startWord: 'GOOD',
    finishWord: 'PURE',
    difficulty: 'hard',
    optimalScore: 292,
    description: 'Navigate the complex path of moral intent.'
  },
  {
    id: 'fire-ice',
    name: 'Elemental Quest',
    startWord: 'FIRE',
    finishWord: 'SNOW',
    difficulty: 'hard',
    optimalScore: 332,
    description: 'From heat to freezing cold.'
  },
  {
    id: 'space-moon',
    name: 'Cosmic Voyage',
    startWord: 'STAR',
    finishWord: 'MOON',
    difficulty: 'hard',
    optimalScore: 284,
    description: 'Navigate the cosmic ladder.'
  },
  {
    id: 'life-death',
    name: 'The Great Cycle',
    startWord: 'LIFE',
    finishWord: 'SOUL',
    difficulty: 'hard',
    optimalScore: 288,
    description: 'Explore the journey of existence and meaning.'
  },
  {
    id: 'heart-brain',
    name: 'Logic vs Passion',
    startWord: 'HEART',
    finishWord: 'BRAIN',
    difficulty: 'hard',
    optimalScore: 396,
    description: 'Connect the two engines of the human experience.'
  },
  // Edgier scenarios
  {
    id: 'dirty-1',
    name: 'Urban Grime',
    startWord: 'CLEAN',
    finishWord: 'MESSY',
    difficulty: 'medium',
    optimalScore: 332,
    description: 'A messy descent into disorder.'
  },
  {
    id: 'dirty-2',
    name: 'The Roast',
    startWord: 'NICE',
    finishWord: 'DICK',
    difficulty: 'hard',
    tags: ['profanity'],
    optimalScore: 184,
    description: 'From compliments to... something else.'
  },
  {
    id: 'dirty-3',
    name: 'Expletive Deleted',
    startWord: 'HELL',
    finishWord: 'FUCK',
    difficulty: 'hard',
    tags: ['profanity'],
    optimalScore: 308,
    description: 'The most direct path between frustrations.'
  }
];
