import { TicTacToe, Status, Player } from "./game.ts";

const WIN_SCORE = 100;
const LOSE_SCORE = -100;
const DRAW_SCORE = 0;

export class Bot {
  private nodesMap = new Map<number, number[]>();

  constructor(private readonly maxDepth = -1) {}

  getBestMove(game: TicTacToe, maximizing = true, depth = 0) {
    if (depth === 0) {
      this.nodesMap.clear();
    }
    if (game.status === Status.Ended || depth === this.maxDepth) {
      const winner = game.turn;
      switch (winner) {
        case Player.X:
          return LOSE_SCORE + depth;
        case Player.O:
          return WIN_SCORE - depth;
        default:
          return DRAW_SCORE;
      }
    }

    const optimizingFn = maximizing ? Math.max : Math.min;

    const availableCells = [...game.board]
      .map((cell, idx) => [cell, idx])
      .filter(([cell]) => cell === Player.None)
      .map(([_, idx]) => idx);

    const best = availableCells.reduce(
      (best, idx) => {
        const turn = game.turn;
        const status = game.status;
        game.playTurn(idx);

        const nodeValue = this.getBestMove(game, !maximizing, depth + 1);

        game.board[idx] = Player.None;
        game.turn = turn;
        game.status = status;

        best = optimizingFn(best, nodeValue);

        if (depth === 0) {
          const oldMoves = this.nodesMap.get(nodeValue) ?? [];

          this.nodesMap.set(nodeValue, [...oldMoves, idx]);
        }

        return best;
      },
      maximizing ? LOSE_SCORE : WIN_SCORE
    );

    if (depth === 0) {
      const bestMoves = this.nodesMap.get(best)!;
      const randIdx = Math.floor(Math.random() * bestMoves.length);

      return bestMoves[randIdx];
    }

    return best;
  }
}
