/**
 * Generates a range of numbers from start to end (inclusive).
 */
export function* range(
  start: number,
  end: number,
): Generator<number, void, unknown> {
  for (let i = start; i <= end; i++) {
    yield i
  }
}
