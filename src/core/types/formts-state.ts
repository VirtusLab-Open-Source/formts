// internal state
export type FormtsState<Values extends object, Err> = {
  values: Values;
  touched: TouchedValues<Values>;
  errors: FieldErrors<Err>;
  validating: FieldValidatingState;
  isSubmitting: boolean;
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
