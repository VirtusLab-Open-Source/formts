export const flatMap = <T, P>(list: T[], map: (x: T) => P[]): P[] => {
  return list.reduce((acc, x) => acc.concat(map(x)), [] as P[]);
};

export const uniqBy = <T, K extends string | number | symbol>(
  list: T[],
  key: (x: T) => K
): T[] => {
  const usedKeys = {} as Record<K, boolean>;

  return list.filter(x => {
    const xKey = key(x);
    if (!!usedKeys[xKey]) {
      return false;
    } else {
      usedKeys[xKey] = true;
      return true;
    }
  });
};

export const compact = <T>(list: Array<T | null | undefined>): T[] =>
  list.filter(it => it != null) as T[];
