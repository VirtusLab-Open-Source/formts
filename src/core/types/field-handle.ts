import { ChangeEvent } from "react";

import { ArrayElement, IdentityDict, IsUnion } from "../../utils";

import { FieldDescriptor } from "./field-descriptor";

/**
 * Interface for specific form field.
 */
// prettier-ignore
export type FieldHandle<T, Err> = 
    & BaseFieldHandle<T, Err>
    & ArrayFieldHandle<T, Err>
    & ObjectFieldHandle<T, Err>
    & ChoiceFieldHandle<T>;

export type _FieldHandleApprox<T, Err> = BaseFieldHandle<T, Err> & {
  children?:
    | Array<_FieldHandleApprox<unknown, Err>>
    | Record<string, _FieldHandleApprox<unknown, Err>>;
  options?: Record<string, string>;
  addItem?: (item: ArrayElement<T>) => void;
  removeItem?: (i: number) => void;
};

export const toApproxFieldHandle = <T, Err>(it: FieldHandle<T, Err>) =>
  it as _FieldHandleApprox<T, Err>;
export const toFieldHandle = <T, Err>(it: _FieldHandleApprox<T, Err>) =>
  it as FieldHandle<T, Err>;

type BaseFieldHandle<T, Err> = {
  /** Unique string generated for each field in the form based on field path */
  id: string;

  /** Field value */
  value: T;

  /** Field error */
  error: null | Err;

  /** True if `setValue` `handleChange` or `handleBlur` was called for this field */
  isTouched: boolean;

  /** True if the field has no error and none of its children fields have errors */
  isValid: boolean;

  /** True if validation process of the field is ongoing */
  isValidating: boolean;

  /** FieldDescriptor corresponding to the field */
  descriptor: FieldDescriptor<T, Err>;

  /**
   * Sets field value.
   * Will cause field validation to run with the `change` trigger.
   * Will set `isTouched` to `true`.
   * If value is not of the desired type there is no effect.
   */
  setValue: (value: T) => void;

  /**
   * Attempts to extract value out of the event based on field type and `event.target`.
   * Will cause field validation to run with the `change` trigger.
   * Will set `isTouched` to `true`.
   * If value of the desired type can't be extracted there is no effect.
   */
  handleChange: (event: ChangeEvent<unknown>) => void;

  /** Sets field error, affecting `isValid` flag */
  setError: (error: null | Err) => void;

  /** runs all validation rules of the field, regardless of their validation triggers */
  validate: () => void;

  /**
   * Will cause field validation to run with the `blur` trigger.
   * Will set `isTouched` to `true`.
   */
  handleBlur: () => void;
};

type ArrayFieldHandle<T, Err> = T extends Array<infer E>
  ? {
      /**
       * Will set the field value its copy with the item added at the end.
       * Will run field validation with `change` trigger.
       * Will set `isTouched` to `true`.
       */
      addItem: (item: E) => void;

      /**
       * Will set the field value its copy with the item at index `i` removed.
       * Will run field validation with `change` trigger.
       * Will set `isTouched` to `true`.
       */
      removeItem: (i: number) => void;

      /**
       * Array of FieldHandles for each item stored in field value
       */
      children: Array<FieldHandle<E, Err>>;
    }
  : void;

type ObjectFieldHandle<T, Err> = T extends Array<any>
  ? void
  : T extends object
  ? {
      /** Object containing FieldHandles for each nested field */
      children: { [K in keyof T]: FieldHandle<T[K], Err> };
    }
  : void;

type ChoiceFieldHandle<T> = [T] extends [string]
  ? IsUnion<T> extends true
    ? {
        /** Dictionary containing options specified in Schema using `choice` function (excluding `""`) */
        options: IdentityDict<Exclude<T, "">>;
      }
    : void
  : void;
