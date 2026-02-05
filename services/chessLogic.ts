import { Chess, Move, Color } from 'chess.js';

// Pre-calculating Piece-Square Tables (PST) for efficiency
const PAWN_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0]
];

const KNIGHT_PST = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50]
];

export class ChessEngine {
  private game: Chess;

  constructor(fen?: string) {
    this.game = new Chess(fen);
  }

  getFen() { return this.game.fen(); }
  getTurn() { return this.game.turn(); }
  getBoard() { return this.game.board(); }
  isGameOver() { return this.game.isGameOver(); }
  isCheckmate() { return this.game.isCheckmate(); }
  isCheck() { return this.game.inCheck(); }
  reset() { this.game.reset(); }
  undoMove() { return this.game.undo(); }

  getKingSquare(color: 'w' | 'b'): string | null {
    const board = this.game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === color) {
          return `${String.fromCharCode(97 + c)}${8 - r}`;
        }
      }
    }
    return null;
  }

  isSquareAttacked(square: string, color: string): boolean {
    return this.game.isAttacked(square as any, color as Color);
  }

  makeMove(move: string | { from: string; to: string; promotion?: string }) {
    try {
      return this.game.move(move);
    } catch (e) {
      return null;
    }
  }

  getValidMoves(square?: string): Move[] {
    return this.game.moves({ square: square as any, verbose: true }) as Move[];
  }

  findMoveFromIntent(pieceType: string | null, targetSquare: string): Move | null {
    const legalMoves = this.game.moves({ verbose: true });
    const candidates = legalMoves.filter(m => {
      const matchTarget = m.to === targetSquare;
      const matchPiece = pieceType ? m.piece === pieceType : true;
      return matchTarget && matchPiece;
    });
    return candidates.length > 0 ? (candidates[0] as Move) : null;
  }

  /**
   * Tactical Scan Engine.
   * Uses Depth 3 for standard balance. Lowering if main-thread lag is detected.
   */
  getBestMove(depth: number = 3): Move | null {
    const moves = this.game.moves({ verbose: true });
    if (moves.length === 0) return null;

    let bestValue = -Infinity;
    let bestMove = moves[0];

    // Randomized sorting to prevent predictable "bot" patterns
    moves.sort(() => Math.random() - 0.5);

    for (const move of moves) {
      this.game.move(move);
      const boardValue = -this.minimax(depth - 1, -Infinity, Infinity, false);
      this.game.undo();

      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    }
    return bestMove as Move;
  }

  private minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    if (depth === 0) return this.evaluateBoard();

    const moves = this.game.moves();
    if (moves.length === 0) {
      if (this.game.isCheckmate()) return isMaximizing ? -20000 : 20000;
      return 0;
    }

    if (isMaximizing) {
      let val = -Infinity;
      for (const m of moves) {
        this.game.move(m);
        val = Math.max(val, this.minimax(depth - 1, alpha, beta, false));
        this.game.undo();
        alpha = Math.max(alpha, val);
        if (beta <= alpha) break;
      }
      return val;
    } else {
      let val = Infinity;
      for (const m of moves) {
        this.game.move(m);
        val = Math.min(val, this.minimax(depth - 1, alpha, beta, true));
        this.game.undo();
        beta = Math.min(beta, val);
        if (beta <= alpha) break;
      }
      return val;
    }
  }

  /**
   * GREEDY EVALUATION PROTOCOL.
   * Material values are massively prioritized to force capture-heavy behavior.
   */
  private evaluateBoard(): number {
    let total = 0;
    const board = this.game.board();
    const currentTurn = this.game.turn();
    
    // GREEDY PIECE WEIGHTS
    const values: Record<string, number> = { 
      p: 100, n: 320, b: 330, r: 500, q: 950, k: 30000 
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          let score = values[piece.type];
          
          // PST adjustments for developmental positioning
          if (piece.type === 'p') score += PAWN_PST[piece.color === 'w' ? 7-r : r][c];
          else if (piece.type === 'n') score += KNIGHT_PST[piece.color === 'w' ? 7-r : r][c];
          
          total += (piece.color === currentTurn ? score : -score);
        }
      }
    }
    return total;
  }
}