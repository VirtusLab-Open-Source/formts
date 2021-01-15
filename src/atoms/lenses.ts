import { ArrayElement } from "../utils";

type Void = undefined | null;

type KeyOf<O> = O extends object
  ? O extends Array<any>
    ? never
    : keyof O
  : never;

type Prop<O, K extends KeyOf<O>> = O extends object ? O[K] : undefined;

export type Lens<S, T> = {
  getter: (state: S) => T;
  setter: (state: S, val: T) => S;
};

export namespace Lens {
  export const prop = <O, P extends KeyOf<O>>(
    prop: P
  ): Lens<O, Prop<O, P>> => ({
    getter: state => state?.[prop] as Prop<O, P>,
    setter: (state, val) => ({ ...state, [prop]: val }),
  });

  export const index = <Arr extends any[] | Void>(
    i: number
  ): Lens<Arr, ArrayElement<Arr> | undefined> => ({
    getter: state => state?.[i],
    setter: (state, el) => Object.assign([], state, { [i]: el }),
  });

  export const forType = <S>() => <T>(lens: Lens<S, T>) => lens;

  // export const chain = <A, B, C>(
  //   l1: Lens<A, B>,
  //   l2: Lens<B, C>
  // ): Lens<A, C> => ({
  //   getter: state => l2.getter(l1.getter(state)),
  //   setter: (state, val) => l1.setter(state, l2.setter(l1.getter(state), val)),
  // });

  // export const chain3 = <A, B, C, D>(
  //   l1: Lens<A, B>,
  //   l2: Lens<B, C>,
  //   l3: Lens<C, D>
  // ): Lens<A, D> => ({
  //   getter: state => l3.getter(l2.getter(l1.getter(state))),
  //   setter: (state, val) =>
  //     l1.setter(
  //       state,
  //       l2.setter(l1.getter(state), l3.setter(l2.getter(l1.getter(state)), val))
  //     ),
  // });

  // prettier-ignore
  type Chain = {
    <A, B, C>(l1: Lens<A, B>, l2: Lens<B, C>): Lens<A, C>;
    <A, B, C, D>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>): Lens<A, D>;
    <A, B, C, D, E>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>): Lens<A, E>;
    <A, B, C, D, E, F>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>, l5: Lens<E, F>): Lens<A, F>;
    <A, B, C, D, E, F, G>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>, l5: Lens<E, F>, l6: Lens<F, G>): Lens<A, G>;
  };
  // export const chainN: ChainN = (...lenses: Array<Lens<any, any>>) => ({
  //   getter: (state: any) =>
  //     lenses.reduce((acc, lens) => lens.getter(acc), state),

  //   setter: (state: any, val: any) => {
  //     let _val = val;
  //     let _lenses = [...lenses];

  //     while (_lenses.length > 0) {
  //       const l = _lenses.pop()!;
  //       const _state = _lenses.reduce((acc, lens) => lens.getter(acc), state);
  //       _val = l.setter(_state, _val);
  //     }

  //     return _val;
  //   },
  // });
  export const chain: Chain = (...lenses: Array<Lens<any, any>>) => ({
    getter: (state: any) =>
      lenses.reduce((acc, lens) => lens.getter(acc), state),

    setter: (state: any, val: any) => {
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
        const _state = rest.reduce((acc, lens) => lens.getter(acc), state);
        const _val = lens.setter(_state, val);
        const [_rest, _lens] = pop(rest);
        return setRecursive(_lens, _rest, _val);
      };

      const [rest, lens] = pop(lenses);
      return setRecursive(lens, rest, val);
    },
  });
}
