import { ArrayElement, Primitive } from "../utils";

type Void = undefined | null;

type KeyOf<O> = O extends object
  ? O extends Array<any>
    ? never
    : keyof O
  : never;

type Prop<O, K extends KeyOf<O>> = O extends object ? O[K] : undefined;

/**
 * used for immutable and composable data updates
 */
export type Lens<S, T> = {
  get: (state: S) => T;
  update: (state: S, setter: (current: T) => T) => S;
};

export namespace Lens {
  /** selects object property */
  export const prop = <O, P extends KeyOf<O>>(prop: P): Lens<O, Prop<O, P>> => {
    type Ret = Lens<O, Prop<O, P>>;
    const get: Ret["get"] = state => state?.[prop] as Prop<O, P>;
    const update: Ret["update"] = (state, setter) => ({
      ...state,
      [prop]: setter(get(state)),
    });

    return { get, update };
  };

  /** selects array item at specified index */
  export const index = <Arr extends any[] | Void>(
    i: number
  ): Lens<Arr, ArrayElement<Arr> | undefined> => {
    type Ret = Lens<Arr, ArrayElement<Arr> | undefined>;
    const get: Ret["get"] = state => state?.[i];
    const update: Ret["update"] = (state, setter) =>
      Object.assign([], state, { [i]: setter(get(state)) });

    return { get, update };
  };

  // prettier-ignore
  export type Compose = {
    <A, B>(l1: Lens<A, B>): Lens<A, B>;
    <A, B, C>(l1: Lens<A, B>, l2: Lens<B, C>): Lens<A, C>;
    <A, B, C, D>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>): Lens<A, D>;
    <A, B, C, D, E>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>): Lens<A, E>;
    <A, B, C, D, E, F>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>, l5: Lens<E, F>): Lens<A, F>;
    <A, B, C, D, E, F, G>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>, l5: Lens<E, F>, l6: Lens<F, G>): Lens<A, G>;
    <A, B, C, D, E, F, G, H>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>, l5: Lens<E, F>, l6: Lens<F, G>, l7: Lens<G, H>): Lens<A, H>;
  };

  const compose2 = <A, B, C>(l1: Lens<A, B>, l2: Lens<B, C>): Lens<A, C> => {
    const get: Lens<A, C>["get"] = state => l2.get(l1.get(state));

    const update: Lens<A, C>["update"] = (state, setter) =>
      l1.update(state, b => l2.update(b, c => setter(c)));

    return { get, update };
  };

  /** combines multiple lenses into single lense operating on nested structure */
  export const compose: Compose = (...lenses: Array<Lens<any, any>>) => {
    const [first, ...rest] = lenses;
    return rest.reduce(compose2, first);
  };

  /** helper identity function providing type parameter S for given lens */
  export const infer = <S>() => <T>(lens: Lens<S, T>) => lens;

  type Builder<S> = [NonNullable<S>] extends [Primitive]
    ? never
    : [NonNullable<S>] extends [any[]]
    ? { index: (i: number) => BuildableLens<S, ArrayElement<S> | undefined> }
    : { prop: <P extends KeyOf<S>>(prop: P) => BuildableLens<S, Prop<S, P>> };

  type BuildableLens<S, Q> = [NonNullable<Q>] extends [Primitive]
    ? Lens<S, Q>
    : [NonNullable<Q>] extends [any[]]
    ? Lens<S, Q> & {
        index: (i: number) => BuildableLens<S, ArrayElement<Q> | undefined>;
      }
    : Lens<S, Q> & {
        prop: <P extends KeyOf<Q>>(prop: P) => BuildableLens<S, Prop<Q, P>>;
      };

  /**
   * create lens for given type
   */
  export const builder = <S>(): Builder<S> => {
    const builder = (lens?: Lens<any, any>) => ({
      prop: (prop: any) =>
        builder(
          lens ? Lens.compose(lens, Lens.prop(prop)) : Lens.prop(prop as any)
        ),

      index: (i: number) =>
        builder(lens ? Lens.compose(lens, Lens.index(i)) : Lens.index(i)),

      ...lens,
    });

    return (builder() as any) as Builder<S>;
  };
}
