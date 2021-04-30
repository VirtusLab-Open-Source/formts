/* eslint-disable @typescript-eslint/no-namespace */

import { Validator } from "../core";
import { Task } from "../utils/task";
import { Primitive, WidenType } from "../utils/utility-types";

// utils

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
 * Composes provided validators using `combinator` fn. 
 * Created validator will run all inner validators in parallel, 
 * and if one or more fails, it will return an error.
 *
 * Tip: use `ErrorType` type to infer type of combined error out of the validator
 * 
 * @example
 * ```ts
    const validPass = combine(
      [
        required("Field is required!"),
        minLength(8, "Field must be at lest 8 characters long!"),
        hasLowerCaseChar("Field must contain at least one lowercase character")
        hasUpperCaseChar("Field must contain at least one uppercase character"),
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
export const required = <T, E>(error: E): Validator.Sync<T, E> => val =>
  val == null || (val as unknown) === "" || (val as unknown) === false
    ? error
    : null;

/**
 * Special validator that breaks validation chains early with no error, when field value is not present.
 * This means that other validators do not have to handle empty value as edge case.
 */
export const optional = <T>() => (val: T): null => {
  const notPresent = required("err")(val) != null;

  if (notPresent) {
    throw true; // special way of breaking validation chain early
  }
  return null;
};

/** checks if value is one of provided values */
export const oneOf = <V extends Primitive, E>(
  allowedValues: V[],
  error: E
): Validator.Sync<WidenType<V>, E> => val =>
  allowedValues.includes(val as V) ? null : error;

// numbers

/** checks if value is integer number */
export const integer = <T extends Numberlike, E>(
  error: E
): Validator.Sync<T, E> => num => (Number.isInteger(num) ? null : error);

/** checks number value against provided minimum */
export const minValue = <T extends Numberlike, E>(
  min: number,
  error: E
): Validator.Sync<T, E> => num => (num === "" || num < min ? error : null);

/** checks number value against provided maximum */
export const maxValue = <T extends Numberlike, E>(
  max: number,
  error: E
): Validator.Sync<T, E> => num => (num === "" || num > max ? error : null);

/** checks if value is a number greater than provided value */
export const greaterThan = <T extends Numberlike, E>(
  threshold: number,
  error: E
): Validator.Sync<T, E> => num =>
  num === "" || num <= threshold ? error : null;

/** checks if value is a number smaller than provided value */
export const lesserThan = <T extends Numberlike, E>(
  threshold: number,
  error: E
): Validator.Sync<T, E> => num =>
  num === "" || num >= threshold ? error : null;

// strings

/** checks pattern exists in string value using `RegExp.test` function */
export const pattern = <T extends string, E>(
  regex: RegExp,
  error: E
): Validator.Sync<T, E> => string => (regex.test(string) ? null : error);

/** checks if string value contains an uppercase character */
export const hasUpperCaseChar = <T extends string, E>(
  error: E
): Validator.Sync<T, E> => (val: string) => (/[A-Z]/.test(val) ? null : error);

/** checks if string value contains an lowercase character */
export const hasLowerCaseChar = <T extends string, E>(
  error: E
): Validator.Sync<T, E> => (val: string) => (/[a-z]/.test(val) ? null : error);

// strings or arrays

/** checks length of string or array value against provided minimum */
export const minLength = <T extends Lenghtable, E>(
  min: number,
  error: E
): Validator.Sync<T, E> => val => (val.length < min ? error : null);

/** checks length of string or array value against provided maximum */
export const maxLength = <T extends Lenghtable, E>(
  max: number,
  error: E
): Validator.Sync<T, E> => val => (val.length > max ? error : null);

/** checks if length of string or array value is equal to expected */
export const exactLength = <T extends Lenghtable, E>(
  expected: number,
  error: E
): Validator.Sync<T, E> => val => (val.length !== expected ? error : null);

// dates

/** compares date value against provided minimum */
export const minDate = <E>(
  min: Date,
  error: E
): Validator.Sync<Date | null, E> => date =>
  date == null || Number.isNaN(date.valueOf()) || date.valueOf() < min.valueOf()
    ? error
    : null;

/** compares date value against provided maximum */
export const maxDate = <E>(
  max: Date,
  error: E
): Validator.Sync<Date | null, E> => date =>
  date == null || Number.isNaN(date.valueOf()) || date.valueOf() > max.valueOf()
    ? error
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

type Numberlike = number | "";
type Lenghtable = { length: number };
