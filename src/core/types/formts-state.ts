// internal state
export type FormtsState<Values extends object> = {
  values: Values;
  touched: TouchedValues<Values>;
};

export type TouchedValues<V> = [V] extends [Array<infer U>]
  ? Array<TouchedValues<U>>
  : [V] extends [object]
  ? { [P in keyof V]: TouchedValues<V[P]> }
  : boolean;
