export const assertNever = (_it: never): never => {
  throw new Error("Illegal state");
};

/**
 * get array of consecutive integers in given range (inclusive)
 */
export const range = (start: number, end: number): number[] => {
  const step = end > start ? 1 : -1;
  const result = [start];

  for (let i = start; i !== end; i = i + step) {
    result.push(i + step);
  }

  return result;
};

export const isValidDate = (val: unknown): val is Date =>
  val instanceof Date && !Number.isNaN(val.valueOf());
