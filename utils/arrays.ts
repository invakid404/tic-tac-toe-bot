export const iota = (length: number, initial = 0): number[] =>
  Array.from({ length }, (_, idx) => idx + initial);

export function* chunkArray<T>(array: T[], size: number) {
  for (let i = 0; i < array.length; i += size) {
    yield array.slice(i, i + size);
  }
}
