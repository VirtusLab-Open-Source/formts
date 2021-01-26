import { Atom } from "../../utils/atoms";

// internal state & actions
export type FormtsAction<Values, Err> =
  | { type: "reset"; payload: { values: Values } }
  | { type: "touchValue"; payload: { path: string } }
  | { type: "setValue"; payload: { path: string; value: any } }
  | { type: "setErrors"; payload: Array<{ path: string; error: Err | null }> }
  | { type: "validatingStart"; payload: { path: string; uuid: string } }
  | { type: "validatingStop"; payload: { path: string; uuid: string } }
  | { type: "setIsSubmitting"; payload: { isSubmitting: boolean } };

export type FormtsState<Values extends object, Err> = {
  values: Values;
  touched: TouchedValues<Values>;
  errors: FieldErrors<Err>;
  validating: FieldValidatingState;
  isSubmitting: boolean;
};

export type FormtsAtomState<Values extends object, Err> = {
  values: Atom<Values>;
  touched: Atom<TouchedValues<Values>>;
  errors: Atom<FieldErrors<Err>>;
  validating: Atom<FieldValidatingState>;
  isSubmitting: Atom<boolean>;
};

export type TouchedValues<V> = [V] extends [Array<infer U>]
  ? Array<TouchedValues<U>>
  : [V] extends [object]
  ? { [P in keyof V]: TouchedValues<V[P]> }
  : boolean;

type FieldPath = string;
type Uuid = string;

export type FieldErrors<Err> = Record<FieldPath, Err | undefined>;

export type FieldValidatingState = Record<FieldPath, Record<Uuid, true>>;
