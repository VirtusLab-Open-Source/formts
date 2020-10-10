// internal state
export type FormtsState<Values extends object, Err> = {
  values: Values;
  touched: TouchedValues<Values>;
  errors: FieldErrors<Err>;
};

export type TouchedValues<V> = [V] extends [Array<infer U>]
  ? Array<TouchedValues<U>>
  : [V] extends [object]
  ? { [P in keyof V]: TouchedValues<V[P]> }
  : boolean;

export type FieldErrors<Err> = Record<string, Err | undefined>;
