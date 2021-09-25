import { index1D, index2D, iota } from "./utils.ts";

export enum GameStateBit {
  XTurn,
  YTurn,
  GameEnded,
}

export enum CellState {
  Empty,
  X,
  Y,
}

export class TicTacToe {
  data: Uint8Array;
  private dataView: DataView;
  board: Uint8Array;

  constructor(data: Uint8Array);
  constructor(size: number, userId: string, opponentId?: string);

  constructor(
    sizeOrData: number | Uint8Array,
    userId?: string,
    opponentId?: string
  ) {
    if (sizeOrData instanceof Uint8Array) {
      this.data = sizeOrData.slice(0);

      this.dataView = new DataView(this.data.buffer);
    } else {
      const boardSize = sizeOrData ** 2;

      this.data = new Uint8Array(this.getSize(boardSize));
      this.dataView = new DataView(this.data.buffer);

      this.dataView.setBigUint64(0, BigInt(userId!));
      opponentId && this.dataView.setBigUint64(8, BigInt(opponentId));
      this.dataView.setUint8(16, 1 << GameStateBit.XTurn);
      this.dataView.setUint8(17, sizeOrData);
    }

    this.board = new Uint8Array(this.data.buffer, 18, this.size ** 2);
  }

  playTurn(cell: number): boolean {
    if (this.board[cell] !== CellState.Empty) {
      return false;
    }

    this.board[cell] = this.turn;

    this.checkWin(cell);
    this.hasEnded || this.toggleTurn();

    return true;
  }

  private toggleTurn() {
    const turn = this.turn;

    this.clearTurn();
    this.turn = turn === CellState.X ? CellState.Y : CellState.X;
  }

  private clearTurn() {
    this.state &= ~(1 << GameStateBit.XTurn);
    this.state &= ~(1 << GameStateBit.YTurn);
  }

  private checkWin(cell: number) {
    const turn = this.turn;
    const hasGameEnded = this.board.every((cell) => cell !== CellState.Empty);

    const cellVal = this.board[cell];
    const [cellX, cellY] = index2D(cell, this.size);

    const indices = iota(this.size);

    const rowWin = indices.every(
      (idx) => this.board[index1D(cellX, idx, this.size)] === cellVal
    );

    const colWin = indices.every(
      (idx) => this.board[index1D(idx, cellY, this.size)] === cellVal
    );

    const diagAWin =
      cellX === cellY &&
      indices.every(
        (idx) => this.board[index1D(idx, idx, this.size)] === cellVal
      );

    const diagBWin =
      cellX + cellY + 1 === this.size &&
      indices.every(
        (idx) =>
          this.board[index1D(idx, this.size - idx - 1, this.size)] === cellVal
      );

    const isWin = rowWin || colWin || diagAWin || diagBWin;

    if (hasGameEnded || isWin) {
      this.clearTurn();
      this.state |= 1 << GameStateBit.GameEnded;

      isWin && (this.turn = turn);
    }
  }

  playBotTurn() {
    if (this.hasEnded) {
      return;
    }

    while (true) {
      const idx = Math.floor(Math.random() * this.size ** 2);
      if (this.board[idx] === CellState.Empty) {
        this.playTurn(idx);

        return;
      }
    }
  }

  getSize(boardSize?: number): number {
    return (
      8 + // player x (snowflake u64) offset 0
      8 + // player y (snowflake u64) offset 8
      1 + // state (u8) offset 16
      1 + // size (u8) offset 17
      (boardSize ?? this.size ** 2) // map (n bytes) offset 18
    );
  }

  get playerX() {
    return this.dataView.getBigUint64(0);
  }

  get playerY() {
    return this.dataView.getBigUint64(8);
  }

  get hasOpponent() {
    return this.playerY !== BigInt(0);
  }

  get state() {
    return this.dataView.getUint8(16);
  }

  set state(value: number) {
    this.dataView.setUint8(16, value);
  }

  get size() {
    return this.dataView.getUint8(17);
  }

  get turn() {
    if (this.state & (1 << GameStateBit.XTurn)) {
      return CellState.X;
    }

    if (this.state & (1 << GameStateBit.YTurn)) {
      return CellState.Y;
    }

    return CellState.Empty;
  }

  set turn(value: number) {
    if (value === CellState.X) {
      this.state |= 1 << GameStateBit.XTurn;
    } else {
      this.state |= 1 << GameStateBit.YTurn;
    }
  }

  get hasEnded() {
    return this.state & (1 << GameStateBit.GameEnded);
  }
}
