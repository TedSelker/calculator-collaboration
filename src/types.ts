
export type Player = 1 | 2;

export enum GamePhase {
  POSING = 'POSING',
  COMPUTING = 'COMPUTING',
  SUCCESS = 'SUCCESS',
  LEVEL_UP = 'LEVEL_UP'
}

export interface GameState {
  level: number;
  currentPlayer: Player; // The player whose turn it is to either POSE or COMPUTE
  phase: GamePhase;
  targetNumber: number | null;
  availableNumbers: number[];
  solution: {
    numbers: number[];
    operators: string[];
  };
  consecutiveSuccesses: Record<Player, number>;
  message: string;
}

export const LEVELS = [
  {
    id: 1,
    numToPick: 2,
    poolSize: 2,
    operators: ['+', '-'],
    requiredSuccesses: 2
  },
  {
    id: 2,
    numToPick: 3,
    poolSize: 5,
    operators: ['+', '-'],
    requiredSuccesses: 2
  },
  {
    id: 3,
    numToPick: 4,
    poolSize: 6,
    operators: ['+', '-'],
    requiredSuccesses: 2
  },
  {
    id: 4,
    numToPick: 3,
    poolSize: 5,
    operators: ['+', '-', '*', '/'],
    requiredSuccesses: 2
  },
  {
    id: 5,
    numToPick: 4,
    poolSize: 6,
    operators: ['+', '-', '*', '/'],
    requiredSuccesses: 2
  }
];
