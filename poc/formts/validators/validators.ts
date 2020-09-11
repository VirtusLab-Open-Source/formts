import { Validator } from "../core";
import { Primitive, WidenType } from "../utils";

export namespace BaseErrors {
  export type Required = { code: "required" };
  export type NotOneOf = { code: "notOneOf"; allowedValues: Primitive[] };

  export type NotInteger = { code: "notInteger" };
  export type MinValue = { code: "minValue"; min: number };
  export type MaxValue = { code: "maxValue"; max: number };
  export type NotGreaterThan = { code: "notGreaterThan"; other: number };
  export type NotLesserThan = { code: "notLesserThan"; other: number };

  export type PatternMismatch = { code: "patternMismatch"; regex: RegExp };
  export type LacksSpecialChar = { code: "lacksSpecialChar" };
  export type LacksUpperCaseChar = { code: "lacksUpperCaseChar" };
  export type LacksLowerCaseChar = { code: "lacksLowerCaseChar" };

  export type MinLength = { code: "minLength"; min: number };
  export type MaxLength = { code: "maxLength"; max: number };
  export type InvalidLength = { code: "invalidLength"; expected: number };

  export type InvalidDate = { code: "invalidDate" };
  export type MinDate = { code: "minDate"; min: Date };
  export type MaxDate = { code: "maxDate"; max: Date };
}

// utils

/**
 * Creates new validator that is a wrapper around provided validator
 * but returning different errors
 *
 * @param validator used to construct new validator
 * @param error errors returned by the new validator
 */
export const withError = <T, Err1, Err2>(
  validator: Validator<T, Err1>,
  error: Err2
): Validator<T, Err2> => val => (validator(val) == null ? null : error);

// general

/** Checks if field value is present */
export const required = (): Validator.Sync<
  unknown,
  BaseErrors.Required
> => val =>
  val == null || val === "" || val === false ? { code: "required" } : null;

/**
 * Special validator that breaks validation chains early with no error, when field value is not present.
 * This means that other validators do not have to handle empty value as edge case.
 */
export const optional = () => (val: unknown): null => {
  const notPresent = required()(val) != null;

  if (notPresent) {
    throw true; // special way of breaking validation chain early
  }
  return null;
};

export const oneOf = <V extends Primitive>(
  ...allowedValues: V[]
): Validator.Sync<WidenType<V>, BaseErrors.NotOneOf> => val =>
  allowedValues.includes(val as V) ? null : { code: "notOneOf", allowedValues };

// numbers

export const integer = (): Validator.Sync<
  number | "",
  BaseErrors.NotInteger
> => num => (Number.isInteger(num) ? null : { code: "notInteger" });

export const minValue = (
  min: number
): Validator.Sync<number | "", BaseErrors.MinValue> => num =>
  num === "" || num < min ? { code: "minValue", min } : null;

export const maxValue = (
  max: number
): Validator.Sync<number | "", BaseErrors.MaxValue> => num =>
  num === "" || num > max ? { code: "maxValue", max } : null;

export const greaterThan = (
  other: number
): Validator.Sync<number | "", BaseErrors.NotGreaterThan> => num =>
  num === "" || num <= other ? { code: "notGreaterThan", other } : null;

export const lesserThan = (
  other: number
): Validator.Sync<number | "", BaseErrors.NotLesserThan> => num =>
  num === "" || num >= other ? { code: "notLesserThan", other } : null;

// strings

export const pattern = (
  regex: RegExp
): Validator.Sync<string, BaseErrors.PatternMismatch> => string =>
  regex.test(string) ? null : { code: "patternMismatch", regex };

export const hasSpecialChar = (): Validator.Sync<
  string,
  BaseErrors.LacksSpecialChar
> => (val: string) =>
  /[!@#$%^&*(),.?":{}|<>\/\\\[\]]/.test(val)
    ? null
    : { code: "lacksSpecialChar" as const };

export const hasUpperCaseChar = (): Validator.Sync<
  string,
  BaseErrors.LacksUpperCaseChar
> => (val: string) =>
  /[A-Z]/.test(val) ? null : { code: "lacksUpperCaseChar" as const };

export const hasLowerCaseChar = (): Validator.Sync<
  string,
  BaseErrors.LacksLowerCaseChar
> => (val: string) =>
  /[a-z]/.test(val) ? null : { code: "lacksLowerCaseChar" as const };

// strings or arrays

export const minLength = (
  min: number
): Validator.Sync<{ length: number }, BaseErrors.MinLength> => val =>
  val.length < min ? { code: "minLength", min } : null;

export const maxLength = (
  max: number
): Validator.Sync<{ length: number }, BaseErrors.MaxLength> => val =>
  val.length > max ? { code: "maxLength", max } : null;

export const exactLength = (
  expected: number
): Validator.Sync<{ length: number }, BaseErrors.InvalidLength> => val =>
  val.length !== expected ? { code: "invalidLength", expected } : null;

// dates

export const validDate = (): Validator.Sync<
  Date | null,
  BaseErrors.InvalidDate
> => date =>
  date == null || Number.isNaN(date.valueOf()) ? { code: "invalidDate" } : null;

export const minDate = (
  min: Date
): Validator.Sync<Date | null, BaseErrors.MinDate> => date =>
  date == null || date.valueOf() < min.valueOf()
    ? { code: "minDate", min }
    : null;

export const maxDate = (
  max: Date
): Validator.Sync<number | "", BaseErrors.MaxDate> => date =>
  date === "" || date.valueOf() > max.valueOf()
    ? { code: "maxDate", max }
    : null;
