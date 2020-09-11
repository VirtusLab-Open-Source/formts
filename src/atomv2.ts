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

namespace Obj {
  export const keys = <O extends object>(object: O) =>
    Object.keys(object) as Array<keyof O>;

  export const values = <O extends object>(object: O) =>
    Object.values(object) as Array<O[keyof O]>;
}

/// Shared types ///

type SubscriberFunc = () => void;

type SubscriptionKey = Nominal<"SubscriptionKey", string>;

/// Atom ///

type AtomImpl<T> = Readonly<{
  readonly val: T;
  set: (val: T) => void;
  subscribe: (fn: SubscriberFunc) => SubscriptionKey;
  unsubscribe: (key: SubscriptionKey) => void;
}>;
export interface Atom<T> extends Nominal<"Atom", AtomImpl<T>> {}

/**
 * Creates Atom.
 * It holds unit of state and allows subscribing to its changes
 */
export function Atom<T>(initialValue: T): Atom<T> {
  const subscribers: SubscriberFunc[] = [];
  let value = initialValue;

  const atom: AtomImpl<T> = {
    get val(): T {
      return value;
    },
    set(v) {
      if (v !== value) {
        value = v;
        subscribers.forEach(s => s());
      }
    },
    subscribe(fn) {
      const key = subscribers.length;
      subscribers[key] = fn;
      return key.toString() as SubscriptionKey;
    },
    unsubscribe(key) {
      delete subscribers[+key];
    },
  };
  return atom as Atom<T>;
}

/// Molecule ///

/**
 * Composes object of Atoms into single Atom of object
 */
export const Molecule = <O extends object>(
  atoms: {
    [K in keyof O]: Atom<O[K]>;
  }
): Atom<O> => {
  const getValue = () => {
    const value: Partial<O> = {};
    for (const key of Obj.keys(atoms)) {
      value[key] = atoms[key].val;
    }
    return value as O;
  };

  let cachedValue = getValue();

  Obj.values(atoms).forEach(a =>
    a.subscribe(() => {
      cachedValue = getValue();
    })
  );

  const molecule: AtomImpl<O> = {
    get val(): O {
      return cachedValue;
    },
    set(v) {
      for (const key of Obj.keys(atoms)) {
        atoms[key].set(v[key]);
      }
    },
    subscribe(fn) {
      const keys = Obj.values(atoms).map(a => a.subscribe(fn));
      return keys.join(":") as SubscriptionKey;
    },
    unsubscribe(key) {
      key.split(":").forEach((k, i) => {
        Obj.values(atoms)[i]?.unsubscribe(k as SubscriptionKey);
      });
    },
  };
  return molecule as Atom<O>;
};

/// useAtom ///

/**
 * Subscribe to changes in Atom or Molecule, ensuring react re-render.
 * This enables usage of atom values inside React components
 */
export function useAtom<T>(atom: Atom<T>): void {
  const update = useForceUpdate();

  React.useEffect(() => {
    const sub = atom.subscribe(update);
    return () => atom.unsubscribe(sub);
  }, [atom, update]);
}

const useForceUpdate = () => {
  const [, set] = React.useState({});

  return React.useCallback(() => {
    set({});
  }, [set]);
};
