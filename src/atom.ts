/**
 * very simple (kindof?) atom implementation
 * based on https://github.com/web-ridge/react-ridge-state
 *
 * for more powerful solutions see:
 * - https://github.com/calmm-js/kefir.atom
 * - https://github.com/facebookexperimental/Recoil
 * - https://github.com/ReactiveX/rxjs with https://github.com/streamich/react-use/blob/master/docs/useObservable.md
 */

import React from "react";

/// Util ///

class Tagged<T> {
  private __tag!: T;
}
type Nominal<Tag, T> = Tagged<Tag> & T;

/// Shared types ///

type SubscriberFunc<T> = (newVal: T) => void;

type SubscriptionKey = Nominal<"SubscriptionKey", number>;

type InternalAtomState<T> = {
  val: T;
  sbs: Array<SubscriberFunc<T>>;
};

/// Atom ///

type AtomImpl<T> = Readonly<{
  state: InternalAtomState<T>;
  readonly val: T;
  set: (val: T) => void;
  subscribe: (fn: SubscriberFunc<T>) => SubscriptionKey;
  unsubscribe: (key: SubscriptionKey) => void;
  clear: () => void;
}>;

export interface Atom<T>
  extends Nominal<
    "Atom",
    Pick<AtomImpl<T>, "val" | "set" | "subscribe" | "unsubscribe" | "clear">
  > {}

/**
 * Creates Atom.
 * Atom is like a simplified Observable.
 * It holds unit of state and allows subscribing to its changes
 */
export function Atom<T>(initialValue: T): Atom<T> {
  const state: InternalAtomState<T> = { val: initialValue, sbs: [] };
  const atom: AtomImpl<T> = {
    state,
    get val(): T {
      return state.val;
    },
    set(v: T) {
      if (v !== state.val) {
        state.val = v;
        setTimeout(() => {
          state.sbs.forEach(s => s(v));
        });
      }
    },
    subscribe: fn => {
      const key = state.sbs.length as SubscriptionKey;
      state.sbs[key] = fn;
      return key;
    },
    unsubscribe: key => {
      delete state.sbs[key];
    },
    clear: () => {
      state.sbs = [];
    },
  };
  return (atom as any) as Atom<T>;
}

/// EntangledAtom ///

type EntangledAtomImpl<T> = Readonly<{
  state: InternalAtomState<T>;
  val: T;
  subscribe: (fn: SubscriberFunc<T>) => SubscriptionKey;
  unsubscribe: (key: SubscriptionKey) => void;
  clear: () => void;
}>;

export interface EntangledAtom<T>
  extends Nominal<
    "EntangledAtom",
    Pick<EntangledAtomImpl<T>, "val" | "subscribe" | "unsubscribe" | "clear">
  > {}

/**
 * Creates EntangledAtom.
 * This is similar to computed state for Vue or reselect for redux.
 * Resolver function will be called on change of any observed atom
 */
export function EntangledAtom<T, A>(
  resolver: (a1: A) => T,
  a1: Atom<A> | EntangledAtom<A>
): EntangledAtom<T>;
export function EntangledAtom<T, A, B>(
  resolver: (a1: A, a2: B) => T,
  a1: Atom<A> | EntangledAtom<A>,
  a2: Atom<B> | EntangledAtom<B>
): EntangledAtom<T>;
export function EntangledAtom<T, A, B, C>(
  resolver: (a1: A, a2: B, a3: C) => T,
  a1: Atom<A> | EntangledAtom<A>,
  a2: Atom<B> | EntangledAtom<B>,
  a3: Atom<C> | EntangledAtom<C>
): EntangledAtom<T>;
export function EntangledAtom<T, A, B, C, D>(
  resolver: (a1: A, a2: B, a3: C, a4: D) => T,
  a1: Atom<A> | EntangledAtom<A>,
  a2: Atom<B> | EntangledAtom<B>,
  a3: Atom<C> | EntangledAtom<C>,
  a4: Atom<D> | EntangledAtom<D>
): EntangledAtom<T>;
export function EntangledAtom<T, A, B, C, D, E>(
  resolver: (a1: A, a2: B, a3: C, a4: D, a5: E) => T,
  a1: Atom<A> | EntangledAtom<A>,
  a2: Atom<B> | EntangledAtom<B>,
  a3: Atom<C> | EntangledAtom<C>,
  a4: Atom<D> | EntangledAtom<D>,
  a5: Atom<E> | EntangledAtom<E>
): EntangledAtom<T>;
export function EntangledAtom<T, A, B, C, D, E, F>(
  resolver: (a1: A, a2: B, a3: C, a4: D, a5: E, a6: F) => T,
  a1: Atom<A> | EntangledAtom<A>,
  a2: Atom<B> | EntangledAtom<B>,
  a3: Atom<C> | EntangledAtom<C>,
  a4: Atom<D> | EntangledAtom<D>,
  a5: Atom<E> | EntangledAtom<E>,
  a6: Atom<F> | EntangledAtom<F>
): EntangledAtom<T>;
export function EntangledAtom<T>(
  resolver: (...values: any[]) => T,
  ...atoms: Array<Atom<any> | EntangledAtom<any>>
): EntangledAtom<T> {
  const state: InternalAtomState<T> = {
    val: resolver(...atoms.map(a => a.val)),
    sbs: [],
  };
  const onChange = () => {
    const val = resolver(...atoms.map(a => a.val));
    if (val !== state.val) {
      state.val = val;
      setTimeout(() => {
        state.sbs.forEach(s => s(val));
      });
    }
  };
  const internalSubscriptions = atoms.map(a => a.subscribe(onChange));

  const entangled: EntangledAtomImpl<T> = {
    state,
    get val(): T {
      return state.val;
    },
    subscribe: fn => {
      const key = state.sbs.length as SubscriptionKey;
      state.sbs[key] = fn;
      return key;
    },
    unsubscribe: key => {
      delete state.sbs[key];
    },
    clear: () => {
      state.sbs = [];
      atoms.forEach((a, i) => a.unsubscribe(internalSubscriptions[i]));
    },
  };

  return (entangled as any) as EntangledAtom<T>;
}

/// useAtom ///

/**
 * Subscribe to changes in Atom or EntangledAtom, ensuring react re-render.
 * This allows usage of atom values inside React components
 */
export function useAtom<T>(atom: Atom<T> | EntangledAtom<T>): void {
  const [, sync] = React.useState<T>(atom.val);

  React.useEffect(() => {
    const sub = atom.subscribe(sync);
    return () => atom.unsubscribe(sub);
  }, [atom, sync]);
}
