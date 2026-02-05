
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'w' | 'b';

export interface Identity {
  name: string;
  role: string;
  description: string;
}

export interface ShadowStrategistIdentities {
  [key: string]: Identity; // key format: "color-type-index" e.g., "w-n-0"
}

export interface GameState {
  fen: string;
  turn: Color;
  lastMove: { from: string; to: string } | null;
  selectedSquare: string | null;
  isListening: boolean;
  statusMessage: string;
}
