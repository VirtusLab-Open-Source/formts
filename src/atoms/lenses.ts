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
  update: (state: S, val: T) => S;
};

export namespace Lens {
  /** selects object property */
  export const prop = <O, P extends KeyOf<O>>(
    prop: P
  ): Lens<O, Prop<O, P>> => ({
    get: state => state?.[prop] as Prop<O, P>,
    update: (state, val) => ({ ...state, [prop]: val }),
  });

  /** selects array item at specified index */
  export const index = <Arr extends any[] | Void>(
    i: number
  ): Lens<Arr, ArrayElement<Arr> | undefined> => ({
    get: state => state?.[i],
    update: (state, el) => Object.assign([], state, { [i]: el }),
  });

  // prettier-ignore
  export type Chain = {
    <A, B>(l1: Lens<A, B>): Lens<A, B>;
    <A, B, C>(l1: Lens<A, B>, l2: Lens<B, C>): Lens<A, C>;
    <A, B, C, D>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>): Lens<A, D>;
    <A, B, C, D, E>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>): Lens<A, E>;
    <A, B, C, D, E, F>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>, l5: Lens<E, F>): Lens<A, F>;
    <A, B, C, D, E, F, G>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>, l5: Lens<E, F>, l6: Lens<F, G>): Lens<A, G>;
    <A, B, C, D, E, F, G, H>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>, l5: Lens<E, F>, l6: Lens<F, G>, l7: Lens<G, H>): Lens<A, H>;
  };

  /** combines multiple lenses into single lense operating on nested structure */
  export const chain: Chain = (...lenses: Array<Lens<any, any>>) => ({
    get: (state: any) => lenses.reduce((acc, lens) => lens.get(acc), state),

    update: (state: any, val: any) => {
      const pop = <T>(arr: T[]): [T[], T | undefined] => {
        const _arr = [...arr];
        const last = _arr.pop();
        return [_arr, last];
      };

      const setRecursive = <A, B>(
        lens: Lens<A, B> | undefined,
        rest: Array<Lens<any, any>>,
        val: B
      ): B => {
        if (!lens) {
          return val;
        }
        const _state = rest.reduce((acc, lens) => lens.get(acc), state);
        const _val = lens.update(_state, val);
        const [_rest, _lens] = pop(rest);
        return setRecursive(_lens, _rest, _val);
      };

      const [rest, lens] = pop(lenses);
      return setRecursive(lens, rest, val);
    },
  });

  /** helper identity function providing type parameter S for given lens */
  export const infer = <S>() => <T>(lens: Lens<S, T>) => lens;

  type Builder<S> = [NonNullable<S>] extends [Primitive]
    ? never
    : [NonNullable<S>] extends [any[]]
    ? { index: (i: number) => Builder2<S, ArrayElement<S> | undefined> }
    : { prop: <P extends KeyOf<S>>(prop: P) => Builder2<S, Prop<S, P>> };

  type Builder2<S, Q> = [NonNullable<Q>] extends [Primitive]
    ? { make: () => Lens<S, Q> }
    : [NonNullable<Q>] extends [any[]]
    ? {
        index: (i: number) => Builder2<S, ArrayElement<Q> | undefined>;
        make: () => Lens<S, Q>;
      }
    : {
        prop: <P extends KeyOf<Q>>(prop: P) => Builder2<S, Prop<Q, P>>;
        make: () => Lens<S, Q>;
      };

  /**
   * create lens for given type
   */
  export const builder = <S>(): Builder<S> => {
    const lenses: Array<Lens<any, any>> = [];

    const builder = {
      prop: <P extends string | number | symbol>(prop: P) => {
        lenses.push(Lens.prop(prop));
        return builder;
      },
      index: (i: number) => {
        lenses.push(Lens.index(i));
        return builder;
      },
      make: () => Lens.chain(...(lenses as [Lens<S, any>])),
    };

    return (builder as any) as Builder<S>;
  };
}
