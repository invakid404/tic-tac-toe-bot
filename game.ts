import { index1D, index2D, iota, isValidSnowflake } from "./utils/index.ts";
import { BOARD_SIZE } from "./const.ts";
import { struct } from "./deps.ts";
import { getBestMove } from "./bot.ts";

export enum Status {
  Playing,
  Ended,
}

export enum Player {
  None,
  X,
  O,
}

enum GameOutcome {
  None,
  Victory,
  Draw,
}

export const TicTacToeState = new struct.default("TicTacToeState")
  .BigUInt64LE("playerX")
  .BigUInt64LE("playerO")
  .Bits8({ turn: [0, 2], status: [2, 1], depth: [3, 5] })
  .UInt8Array("board", BOARD_SIZE ** 2)
  .compile();

export type TicTacToeState = struct.ExtractType<typeof TicTacToeState>;

export class TicTacToe {
  static newGame(
    userId: string,
    opponentId: string | undefined,
    depth: number
  ) {
    const game = new TicTacToeState();

    game.playerX = BigInt(userId);
    opponentId && (game.playerO = BigInt(opponentId));
    game.turn = Player.X;
    game.depth = depth;

    return new TicTacToe(game);
  }

  static parseGame(raw: number[]) {
    const game = new TicTacToeState(raw);

    return new TicTacToe(game);
  }

  private constructor(public readonly state: TicTacToeState) {}

  playTurn(cellIdx: number): boolean {
    if (this.state.board[cellIdx] !== Player.None) {
      return false;
    }

    this.state.board[cellIdx] = this.turn;

    const outcome = this.checkOutcome(cellIdx);
    if (outcome !== GameOutcome.None) {
      this.state.status = Status.Ended;

      outcome === GameOutcome.Draw && (this.state.turn = Player.None);

      return true;
    }

    this.toggleTurn();

    return true;
  }

  playBotTurn() {
    if (this.status !== Status.Playing) {
      return;
    }

    const botMove = getBestMove(this, this.state.depth || -1);

    this.playTurn(botMove);
  }

  private checkOutcome(cellIdx: number): GameOutcome {
    const hasEmptyCells = this.state.board.some(
      (cell: Player) => cell === Player.None
    );

    const cellValue = this.state.board[cellIdx];
    const [cellX, cellY] = index2D(cellIdx, BOARD_SIZE);

    const checkVictory = (idxMapper: (idx: number) => [number, number]) =>
      iota(BOARD_SIZE).every((idx) => {
        const [currX, currY] = idxMapper(idx);
        const currIdx = index1D(currX, currY, BOARD_SIZE);

        return this.state.board[currIdx] === cellValue;
      });

    const checkRowVictory = () => checkVictory((idx) => [cellX, idx]);
    const checkColVictory = () => checkVictory((idx) => [idx, cellY]);

    const checkDiagAVictory = () =>
      cellX === cellY && checkVictory((idx) => [idx, idx]);

    const checkDiagBVictory = () =>
      cellX + cellY === BOARD_SIZE - 1 &&
      checkVictory((idx) => [idx, BOARD_SIZE - idx - 1]);

    const hasWon =
      checkRowVictory() ||
      checkColVictory() ||
      checkDiagAVictory() ||
      checkDiagBVictory();

    if (!hasWon) {
      return hasEmptyCells ? GameOutcome.None : GameOutcome.Draw;
    }

    return GameOutcome.Victory;
  }

  private toggleTurn() {
    this.state.turn ^= Player.X | Player.O;
  }

  get raw() {
    return TicTacToeState.raw(this.state);
  }

  get playerX(): bigint {
    return this.state.playerX;
  }

  get playerO(): bigint {
    return this.state.playerO;
  }

  get hasOpponent() {
    return isValidSnowflake(this.playerO);
  }

  get toPlay(): bigint | undefined {
    switch (this.turn) {
      case Player.X:
        return this.playerX;
      case Player.O:
        return this.playerO;
      default:
        return undefined;
    }
  }

  set turn(value: Player) {
    this.state.turn = value;
  }

  get turn(): Player {
    return this.state.turn;
  }

  get status(): Status {
    return this.state.status;
  }

  set status(value: Status) {
    this.state.status = value;
  }

  get board(): Uint8Array {
    return this.state.board;
  }

  set board(value: Uint8Array) {
    this.state.board = value;
  }
}
