import { Atom } from "../../utils/atoms";

import { FieldDescriptor } from "./field-descriptor";

// internal state & actions
export type FormtsAction<Values extends object, Err> =
  | { type: "resetForm"; payload: { newInitialValues?: InitialValues<Values> } }
  | { type: "resetField"; payload: { field: FieldDescriptor<unknown> } }
  | {
      type: "setTouched";
      payload: { field: FieldDescriptor<unknown>; touched: boolean };
    }
  | {
      type: "setValue";
      payload: { field: FieldDescriptor<unknown>; value: any };
    }
  | { type: "setErrors"; payload: Array<{ path: string; error: Err | null }> }
  | { type: "validatingStart"; payload: { path: string; uuid: string } }
  | { type: "validatingStop"; payload: { path: string; uuid: string } }
  | { type: "submitStart" }
  | { type: "submitSuccess" }
  | { type: "submitFailure" };

export type FormtsAtomState<Values extends object, Err> = {
  initialValues: Atom<Values>;
  values: Atom<Values>;
  touched: Atom<TouchedValues<Values>>;
  errors: Atom<FieldErrors<Err>>;
  validating: Atom<FieldValidatingState>;
  isSubmitting: Atom<boolean>;
  successfulSubmitCount: Atom<number>;
  failedSubmitCount: Atom<number>;
};

export type TouchedValues<V> = [V] extends [Array<infer U>]
  ? Array<TouchedValues<U>>
  : [V] extends [object]
  ? { [P in keyof V]: TouchedValues<V[P]> }
  : boolean;

/** DeepPartial, except for objects inside arrays */
// prettier-ignore
export type InitialValues<T> = T extends Function
? T
: T extends Array<any>
  ? T
  : T extends object
    ? { [P in keyof T]?: InitialValues<T[P]> }
    : T | undefined;

type FieldPath = string;
type Uuid = string;

export type FieldErrors<Err> = Record<FieldPath, Err | undefined>;

export type FieldValidatingState = Record<FieldPath, Record<Uuid, true>>;
