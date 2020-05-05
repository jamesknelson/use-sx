export function flatMap<T, E>(
  array: T[],
  fn: (t: T, i: number) => E | E[],
): E[] {
  return [].concat.apply([], array.map(fn) as any)
}
