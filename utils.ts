export const iota = (length: number, initial = 0) =>
  Array.from({ length }, (_, idx) => idx + initial);

export const index1D = (idxA: number, idxB: number, size: number): number =>
  idxA * size + idxB;

export const index2D = (idx: number, size: number): [number, number] => {
  return [Math.floor(idx / size), idx % size];
};
