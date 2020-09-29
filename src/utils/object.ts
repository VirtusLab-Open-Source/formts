import { DeepPartial } from "./utility-types";

export const entries = <T extends object>(o: T): [keyof T, T[keyof T]][] =>
  Object.entries(o) as any;

export const keys = <T extends object>(o: T): (keyof T)[] =>
  Object.keys(o) as (keyof T)[];

export const record = <T extends string | number | symbol, V>(
  keys: T[],
  value: V
): Record<T, V> =>
  keys.reduce((acc, key) => {
    acc[key] = value;
    return acc;
  }, {} as Record<T, V>);

// dummy impl
export const get = (o: object, path: string) => {
  const pathSegments = getPathSegments(path);
  let current = o;

  for (let depth = 0; depth < pathSegments.length; depth++) {
    const segment = pathSegments[depth];

    if (segment in current) {
      current = (current as any)[segment];
    } else {
      return undefined;
    }
  }

  return current;
};

// dummy impl
export const set = (o: object, path: string, value: any) => {
  const pathSegments = getPathSegments(path);
  if (pathSegments.length === 0) {
    return o;
  } else {
    return setRecursive(o, value, pathSegments);
  }
};

const setRecursive = (obj: object, value: any, pathSegments: string[]) => {
  const path = pathSegments[0];
  const copy = Array.isArray(obj) ? [...obj] : ({ ...obj } as any);
  if (pathSegments.length === 1) {
    copy[path] = value;
  } else {
    copy[path] = setRecursive(copy[path], value, pathSegments.slice(1));
  }
  return copy;
};

const getPathSegments = (path: string): string[] => {
  return path
    .replace(/(\[|\])/g, ".")
    .split(".")
    .filter((x: string) => x.length > 0);
};

export const deepMerge = <T extends object>(
  origin: T,
  x: DeepPartial<T>
): T => {
  return keys(origin).reduce((acc, key) => {
    const value = origin[key];
    const toMerge = (x as Partial<T>)[key];
    acc[key] =
      toMerge !== undefined
        ? Array.isArray(toMerge) ||
          typeof toMerge !== "object" ||
          toMerge === null
          ? toMerge
          : deepMerge(value, toMerge as any)
        : value;
    return acc;
  }, {} as T);
};
