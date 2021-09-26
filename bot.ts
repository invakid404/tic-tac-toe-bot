import { TicTacToe, Status, Player } from "./game.ts";

const WIN_SCORE = 100;
const LOSE_SCORE = -100;
const DRAW_SCORE = 0;

export const getBestMove = (
  game: TicTacToe,
  maxDepth: number,
  depth = 0,
  alpha = -Infinity,
  beta = +Infinity
) => {
  if (game.status === Status.Ended || depth === maxDepth) {
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

  const maximizing = game.turn === Player.O;

  let bestMove = -1;
  let bestScore = maximizing ? LOSE_SCORE : WIN_SCORE;

  const availableCells = [...game.board]
    .map((cell, idx) => [cell, idx])
    .filter(([cell]) => cell === Player.None)
    .map(([_, idx]) => idx);

  for (const idx of availableCells) {
    const oldTurn: Player = game.turn;
    const oldStatus: Status = game.status;

    game.playTurn(idx);

    const score = getBestMove(game, maxDepth, depth + 1, alpha, beta);

    game.board[idx] = Player.None;
    game.status = oldStatus;
    game.turn = oldTurn;

    const hasImprovedScore = bestScore < score;

    if (hasImprovedScore === maximizing) {
      bestScore = score;
      bestMove = idx;

      if (maximizing) {
        alpha = Math.max(alpha, bestScore);
      } else {
        beta = Math.min(beta, bestScore);
      }
    }

    if (beta <= alpha) {
      break;
    }
  }

  if (depth === 0) {
    return bestMove;
  }

  return bestScore;
};
