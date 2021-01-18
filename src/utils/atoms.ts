import { Nominal } from "../utils";
import { Lens } from "../utils/lenses";

type SubscriberFunc<T> = (val: T) => void;
type SubscriptionKey = Nominal<"SubscriptionKey"> & string;

/**
 * Composable and observable container for mutable state
 */
export type Atom<T> = {
  val: T;
  set: (state: T) => void;
  subscribe: (fn: SubscriberFunc<T>) => SubscriptionKey;
  unsubscribe: (key: SubscriptionKey) => void;
};

export namespace Atom {
  /**
   * Create atom holding provided initial value
   */
  export const of = <T>(initial: T): Atom<T> => {
    const subscribers: SubscriberFunc<T>[] = [];
    let val = initial;

    return {
      get val(): T {
        return val;
      },
      set(it) {
        if (it !== val) {
          val = it;
          subscribers.forEach(s => s(it));
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
  };

  /**
   * Create atom connected to provided source atom via a Lens.
   * Updates to either atom will be reflected in the other one.
   */
  export const entangle = <P, Q>(atom: Atom<P>, lens: Lens<P, Q>): Atom<Q> => {
    const subscribers: SubscriberFunc<Q>[] = [];
    let val = lens.get(atom.val);

    atom.subscribe(it => {
      const newVal = lens.get(it);
      if (newVal !== val) {
        val = newVal;
        subscribers.forEach(s => s(newVal));
      }
    });

    return {
      get val(): Q {
        return val;
      },
      set(it: Q) {
        if (it !== val) {
          val = it;
          atom.set(lens.update(atom.val, () => it));
          subscribers.forEach(s => s(it));
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
  };

  export interface Readonly<T> extends Omit<Atom<T>, "set"> {}

  /**
   * Combine multiple atoms using `combinator` function into readonly atom.
   * This is similar to redux selector
   */
  export const fuse = <T extends unknown[], Q>(
    combinator: (...values: readonly [...T]) => Q,
    ...atoms: { [P in keyof T]: Atom<T[P]> | Atom.Readonly<T[P]> }
  ): Atom.Readonly<Q> => {
    const subscribers: SubscriberFunc<Q>[] = [];
    let val = combinator(...(atoms.map(a => a.val) as T));

    atoms.forEach(a =>
      a.subscribe(() => {
        const newVal = combinator(...(atoms.map(a => a.val) as T));
        if (newVal !== val) {
          val = newVal;
          subscribers.forEach(s => s(newVal));
        }
      })
    );

    return {
      get val(): Q {
        return val;
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
  };
}
