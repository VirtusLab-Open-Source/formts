import { DeepPartial, IdentityDict } from "./utility-types";

export const entries = <T extends object>(o: T): [keyof T, T[keyof T]][] =>
  Object.entries(o) as any;

export const keys = <T extends object>(o: T): (keyof T)[] =>
  Object.keys(o) as (keyof T)[];

export const values = <T extends object>(o: T): T[keyof T][] =>
  Object.values(o) as T[keyof T][];

export const filter = <T>(
  obj: Record<string, T>,
  predicate: (input: { key: string; value: T }) => boolean
): Record<string, T> =>
  entries(obj).reduce((acc, [key, value]) => {
    if (predicate({ key, value })) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, T>);

type JsPropertyDescriptor<T> = {
  configurable?: boolean;
  enumerable?: boolean;
  value?: T;
  writable?: boolean;
  get?(): T;
  set?(v: T): void;
};
export const defineProperties = <T extends object, P extends object>(
  obj: T,
  props: {
    [K in keyof P]: JsPropertyDescriptor<P[K]>;
  }
) => Object.defineProperties(obj, props) as T & P;

export const toIdentityDict = <T extends string>(
  values: T[]
): IdentityDict<T> =>
  values.reduce((dict, val) => {
    (dict as any)[val] = val;
    return dict;
  }, {} as IdentityDict<T>);

export const isPlainObject = (it: unknown): it is object =>
  it != null && typeof it === "object" && (it as any).constructor === Object;

// dummy impl
export const get = <T extends object>(o: T, path: string): any => {
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
export const set = <T>(o: T, path: string, value: any): T => {
  const pathSegments = getPathSegments(path);
  if (pathSegments.length === 0) {
    return o;
  } else {
    return setRecursive(o, value, pathSegments);
  }
};

const setRecursive = <T>(obj: T, value: any, pathSegments: string[]): T => {
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
          toMerge === null ||
          (toMerge as any) instanceof Date
          ? toMerge
          : deepMerge(value, toMerge as any)
        : value;
    return acc;
  }, {} as T);
};

export const deepEqual = (left: unknown, right: unknown): boolean => {
  if (typeof left !== typeof right) {
    return false;
  }

  if ((!left && !!right) || (!!left && !right)) {
    return false;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length
      ? left.every((el, i) => deepEqual(el, right[i]))
      : false;
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    return (
      deepEqual(Object.keys(left), Object.keys(right)) &&
      deepEqual(Object.values(left), Object.values(right))
    );
  }

  if (left instanceof Date && right instanceof Date) {
    return deepEqual(left.getTime(), right.getTime());
  }

  if (Number.isNaN(left) && Number.isNaN(right)) {
    return true;
  }

  return left === right;
};
