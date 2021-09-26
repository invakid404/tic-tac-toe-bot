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
      console.log("game ended with winner", winner);

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
        const clone = TicTacToe.parseGame([...game.raw!.values()]);
        clone.playTurn(idx);

        const nodeValue = this.getBestMove(clone, !maximizing, depth + 1);

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
      console.log(this.nodesMap);

      const bestMoves = this.nodesMap.get(best)!;
      const randIdx = Math.floor(Math.random() * bestMoves.length);

      return bestMoves[randIdx];
    }

    return best;
  }
}