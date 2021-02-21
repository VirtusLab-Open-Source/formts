/* eslint-disable @typescript-eslint/no-namespace */

import { Validator } from "../core";
import { Task } from "../utils/task";
import { Primitive, WidenType } from "../utils/utility-types";

import * as BaseErrors from "./base-errors";

// utils

/**
 * Creates new validator that is a wrapper around provided validator
 * but returning different errors
 *
 * @param validator used to construct new validator
 * @param error errors returned by the new validator
 */
export const withError = <T, Err1, Err2>(
  validator: Validator.Sync<T, Err1>,
  error: Err2
): Validator.Sync<T, Err2> => val => (validator(val) == null ? null : error);

type Combine = {
  <T, E, E1>(
    validators: [Validator<T, E1>],
    combinator: (errors: NullableTuple<[E1]>) => E
  ): Validator<T, E>;
  <T, E, E1, E2>(
    validators: [Validator<T, E1>, Validator<T, E2>],
    combinator: (errors: NullableTuple<[E1, E2]>) => E
  ): Validator<T, E>;
  <T, E, E1, E2, E3>(
    validators: [Validator<T, E1>, Validator<T, E2>, Validator<T, E3>],
    combinator: (errors: NullableTuple<[E1, E2, E3]>) => E
  ): Validator<T, E>;
  <T, E, E1, E2, E3, E4>(
    validators: [
      Validator<T, E1>,
      Validator<T, E2>,
      Validator<T, E3>,
      Validator<T, E4>
    ],
    combinator: (errors: NullableTuple<[E1, E2, E3, E4]>) => E
  ): Validator<T, E>;
  <T, E, E1, E2, E3, E4, E5>(
    validators: [
      Validator<T, E1>,
      Validator<T, E2>,
      Validator<T, E3>,
      Validator<T, E4>,
      Validator<T, E5>
    ],
    combinator: (errors: NullableTuple<[E1, E2, E3, E4, E5]>) => E
  ): Validator<T, E>;
  <T, E, E1, E2, E3, E4, E5, E6>(
    validators: [
      Validator<T, E1>,
      Validator<T, E2>,
      Validator<T, E3>,
      Validator<T, E4>,
      Validator<T, E5>,
      Validator<T, E6>
    ],
    combinator: (errors: NullableTuple<[E1, E2, E3, E4, E5, E6]>) => E
  ): Validator<T, E>;
  <T, E, E1, E2, E3, E4, E5, E6, E7>(
    validators: [
      Validator<T, E1>,
      Validator<T, E2>,
      Validator<T, E3>,
      Validator<T, E4>,
      Validator<T, E5>,
      Validator<T, E6>,
      Validator<T, E7>
    ],
    combinator: (errors: NullableTuple<[E1, E2, E3, E4, E5, E6, E7]>) => E
  ): Validator<T, E>;
  <T, E, E1, E2, E3, E4, E5, E6, E7, E8>(
    validators: [
      Validator<T, E1>,
      Validator<T, E2>,
      Validator<T, E3>,
      Validator<T, E4>,
      Validator<T, E5>,
      Validator<T, E6>,
      Validator<T, E7>,
      Validator<T, E8>
    ],
    combinator: (errors: NullableTuple<[E1, E2, E3, E4, E5, E6, E7, E8]>) => E
  ): Validator<T, E>;
  <T, E, E1, E2, E3, E4, E5, E6, E7, E8, E9>(
    validators: [
      Validator<T, E1>,
      Validator<T, E2>,
      Validator<T, E3>,
      Validator<T, E4>,
      Validator<T, E5>,
      Validator<T, E6>,
      Validator<T, E7>,
      Validator<T, E8>,
      Validator<T, E9>
    ],
    combinator: (
      errors: NullableTuple<[E1, E2, E3, E4, E5, E6, E7, E8, E9]>
    ) => E
  ): Validator<T, E>;
  <T, E, E1, E2, E3, E4, E5, E6, E7, E8, E9, E10>(
    validators: [
      Validator<T, E1>,
      Validator<T, E2>,
      Validator<T, E3>,
      Validator<T, E4>,
      Validator<T, E5>,
      Validator<T, E6>,
      Validator<T, E7>,
      Validator<T, E8>,
      Validator<T, E9>,
      Validator<T, E10>
    ],
    combinator: (
      errors: NullableTuple<[E1, E2, E3, E4, E5, E6, E7, E8, E9, E10]>
    ) => E
  ): Validator<T, E>;
};

/**
 * Creates validator that runs all provided validators at the same time
 * and if one ore more fails, returns error created using `combinator` function.
 *
 * Tip: use `ErrorType` type to infer type of combined error out of the validator
 * 
 * @example
 * ```ts
    const validPass = combine(
      [
        required(),
        minLength(8),
        hasLowerCaseChar()
        hasUpperCaseChar(),
      ],
      ([required, minLength, lowerChar, upperChar]) => ({
        code: "validPass" as const,
        rules: { required, minLength, lowerChar, upperChar },
      })
    );

    type ValidPassErr = ErrorType<typeof validPass>;
 * ```
 */
export const combine: Combine = <T, E>(
  validators: Array<Validator<T, unknown>>,
  combinator: (errors: any) => E
) => (val: T) =>
  Task.all(...validators.map(v => Task.from(() => v(val))))
    .map(errors => {
      if (errors.every(e => e == null)) {
        return null;
      } else {
        return combinator(errors);
      }
    })
    .runPromiseOrGet();

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

/** checks if value is one of provided values */
export const oneOf = <V extends Primitive>(
  ...allowedValues: V[]
): Validator.Sync<WidenType<V>, BaseErrors.OneOf> => val =>
  allowedValues.includes(val as V) ? null : { code: "oneOf", allowedValues };

// numbers

/** checks if value is integer number */
export const integer = (): Validator.Sync<
  number | "",
  BaseErrors.Integer
> => num => (Number.isInteger(num) ? null : { code: "integer" });

/** checks number value against provided minimum */
export const minValue = (
  min: number
): Validator.Sync<number | "", BaseErrors.MinValue> => num =>
  num === "" || num < min ? { code: "minValue", min } : null;

/** checks number value against provided maximum */
export const maxValue = (
  max: number
): Validator.Sync<number | "", BaseErrors.MaxValue> => num =>
  num === "" || num > max ? { code: "maxValue", max } : null;

/** checks if value is a number greater than provided value */
export const greaterThan = (
  threshold: number
): Validator.Sync<number | "", BaseErrors.GreaterThan> => num =>
  num === "" || num <= threshold ? { code: "greaterThan", threshold } : null;

/** checks if value is a number smaller than provided value */
export const lesserThan = (
  threshold: number
): Validator.Sync<number | "", BaseErrors.LesserThan> => num =>
  num === "" || num >= threshold ? { code: "lesserThan", threshold } : null;

// strings

/** checks pattern exists in string value using `RegExp.test` function */
export const pattern = (
  regex: RegExp
): Validator.Sync<string, BaseErrors.Pattern> => string =>
  regex.test(string) ? null : { code: "pattern", regex };

/** checks if string value contains an uppercase character */
export const hasUpperCaseChar = (): Validator.Sync<
  string,
  BaseErrors.HasUpperCaseChar
> => (val: string) =>
  /[A-Z]/.test(val) ? null : { code: "hasUpperCaseChar" as const };

/** checks if string value contains an lowercase character */
export const hasLowerCaseChar = (): Validator.Sync<
  string,
  BaseErrors.HasLowerCaseChar
> => (val: string) =>
  /[a-z]/.test(val) ? null : { code: "hasLowerCaseChar" as const };

// strings or arrays

/** checks length of string or array value against provided minimum */
export const minLength = (
  min: number
): Validator.Sync<{ length: number }, BaseErrors.MinLength> => val =>
  val.length < min ? { code: "minLength", min } : null;

/** checks length of string or array value against provided maximum */
export const maxLength = (
  max: number
): Validator.Sync<{ length: number }, BaseErrors.MaxLength> => val =>
  val.length > max ? { code: "maxLength", max } : null;

/** checks if length of string or array value is equal to expected */
export const exactLength = (
  expected: number
): Validator.Sync<{ length: number }, BaseErrors.ExactLength> => val =>
  val.length !== expected ? { code: "exactLength", expected } : null;

// dates

/** compares date value against provided minimum */
export const minDate = (
  min: Date
): Validator.Sync<Date | null, BaseErrors.MinDate> => date =>
  date == null || Number.isNaN(date.valueOf()) || date.valueOf() < min.valueOf()
    ? { code: "minDate", min }
    : null;

/** compares date value against provided maximum */
export const maxDate = (
  max: Date
): Validator.Sync<Date | null, BaseErrors.MaxDate> => date =>
  date == null || Number.isNaN(date.valueOf()) || date.valueOf() > max.valueOf()
    ? { code: "maxDate", max }
    : null;

// prettier-ignore
/** Infer error type of given validator or validator factory function */
export type ErrorType<TValidator> = 
    TValidator extends ValidatorFactory<any,any, infer Err1> 
    ? Err1 
    : TValidator extends Validator<any, infer Err2>
      ? Err2
      : never;

type ValidatorFactory<Args, T, Err> = (args: Args) => Validator<T, Err>;

type NullableTuple<Arr extends any[]> = { [I in keyof Arr]: Arr[I] | null };
