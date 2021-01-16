import { ArrayElement } from "./utility-types";

type Void = undefined | null;

type KeyOf<O> = O extends object
  ? O extends Array<any>
    ? never
    : keyof O
  : never;

type Prop<O, K extends KeyOf<O>> = O extends object ? O[K] : undefined;

/**
 * Toy implementation of lenses, for something more advanced see https://github.com/gcanti/monocle-ts
 * Note: Partial lenses are somewhat supported but can produce partial results typed as non-partial :(
 */
export type Lens<S, T> = {
  get: (state: S) => T;
  update: (state: S, setter: (current: T) => T) => S;
};

export namespace Lens {
  /** identity lens, useful as starting point in compose function */
  export const identity = <T>(): Lens<T, T> => ({
    get: it => it,
    update: (it, setter) => setter(it),
  });

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

  /** combines multiple lenses into single lens operating on nested structure */
  export const compose: Compose = (...lenses: Array<Lens<any, any>>) => {
    const [first, ...rest] = lenses;
    return rest.reduce(compose2, first);
  };
}
