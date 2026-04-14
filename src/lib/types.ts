export type ActionType = 'morph' | 'anagram' | 'synonym' | 'antonym';

export interface BaseStep {
  word: string;
  timestamp: number;
  obscurity: number;
}

export interface OriginStep extends BaseStep {
  type: 'origin';
}

export interface WaypointStep extends BaseStep {
  type: 'waypoint';
  action: ActionType;
  score: number;
}

export interface DestinationStep extends BaseStep {
  type: 'destination';
  isReached: boolean;
  action?: ActionType;
  score?: number;
}

export type JourneyStep = OriginStep | WaypointStep | DestinationStep;

export interface ValidationResult {
  isValid: boolean;
  action?: ActionType;
  errors: string[];
  diffCount?: number;
  obscurity?: number;
}
