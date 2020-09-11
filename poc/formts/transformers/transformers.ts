import { Transformer } from "../core";

// general
export const mapValues = <T>(fn: (val: T) => T): Transformer<T> => value => ({
  ok: true,
  value: fn(value),
});

export const filterValues = <T>(
  fn: (val: T) => boolean
): Transformer<T> => value => (fn(value) ? { ok: true, value } : { ok: false });

// string
export const toUpperCase = (): Transformer<string> =>
  mapValues(string => string.toUpperCase());

export const toLowerCase = (): Transformer<string> =>
  mapValues(string => string.toLowerCase());

export const trim = (): Transformer<string> =>
  mapValues(string => string.trim());

// string or array
export const limitLength = (
  maxLength: number
): Transformer<string | Array<unknown>> =>
  mapValues(val => (val.length > maxLength ? val.slice(0, maxLength) : val));

// number
export const round = (
  method: "floor" | "ceil" | "trunc" | "round"
): Transformer<number | ""> =>
  mapValues(val => (val === "" ? val : Math[method](val)));
