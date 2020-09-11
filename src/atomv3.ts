import React from "react";

/// Util ///
class Tagged<T> {
  private __tag!: T;
}
type Nominal<Tag, T> = Tagged<Tag> & T;

/// Shared types ///

type SubscriberFunc = () => void;

type SubscriptionKey = Nominal<"SubscriptionKey", string>;

/// State ///

type StateImpl<T> = Readonly<{
  val: T;
  set: (state: T) => void;
  subscribe: (fn: SubscriberFunc) => SubscriptionKey;
  unsubscribe: (key: SubscriptionKey) => void;
}>;
export interface State<T> extends Nominal<"Store", StateImpl<T>> {}

export function State<T>(initialValue: T): State<T> {
  const subscribers: SubscriberFunc[] = [];
  let val = initialValue;

  const impl: StateImpl<T> = {
    get val(): T {
      return val;
    },
    set(it) {
      if (it !== val) {
        val = it;
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
  return impl as State<T>;
}

type Lens = {
  <S, T>(
    state: State<S>,
    getter: (state: S) => T,
    setter: (state: S, val: T) => S
  ): State<T>;
  <S extends Array<any>>(state: State<S>, index: number): State<S[number]>;
  <S extends object, P extends keyof S>(
    state: State<S>,
    prop: P
  ): S extends Array<any> ? never : State<S[P]>;
};
export const Lens = (<S, T>(state: State<S>, arg2: unknown, arg3: unknown) => {
  if (typeof arg2 === "function" && typeof arg3 === "function") {
    const getter = arg2 as (state: S) => T;
    const setter = arg3 as (state: S, val: T) => S;
    return createLens(state, getter, setter);
  }

  if (Array.isArray(state.val) && typeof arg2 === "number") {
    const index = arg2;
    return createLens(
      state,
      state => (state as any)[index],
      (state, v) => Object.assign([], state, { [index]: v })
    );
  }

  const prop = arg2 as keyof S;
  return createLens(
    state,
    state => state[prop],
    (state, v) => Object.assign({}, state, { [prop]: v })
  );
}) as Lens;

function createLens<S, T>(
  state: State<S>,
  getter: (state: S) => T,
  setter: (state: S, val: T) => S
): State<T> {
  const subscribers: SubscriberFunc[] = [];
  let val = getter(state.val);

  state.subscribe(() => {
    const newVal = getter(state.val);
    if (newVal !== val) {
      val = newVal;
      subscribers.forEach(s => s());
    }
  });

  const impl: StateImpl<T> = {
    get val(): T {
      return val;
    },
    set(it: T) {
      if (it !== val) {
        val = it;
        state.set(setter(state.val, it));
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
  return impl as State<T>;
}

// type SimpleLens = {
//   <S extends Array<any>>(state: State<S>, index: number): State<S[number]>;
//   <S extends object, P extends keyof S>(
//     state: State<S>,
//     prop: P
//   ): S extends Array<any> ? never : State<S[P]>;
// };
// export const SimpleLens: SimpleLens = <S, P extends keyof S>(
//   state: State<S>,
//   prop: P
// ): State<S[P]> =>
//   Array.isArray(state)
//     ? Lens(
//         state,
//         (state) => state[prop],
//         (state, v) => Object.assign([], state, { [prop]: v })
//       )
//     : Lens(
//         state,
//         (state) => state[prop],
//         (state, v) => Object.assign({}, state, { [prop]: v })
//       );

/// useWatch ///

export function useWatch<T>(state: State<T>): void {
  const update = useForceUpdate();

  React.useEffect(() => {
    const sub = state.subscribe(update);
    return () => state.unsubscribe(sub);
  }, [state, update]);
}

const useForceUpdate = () => {
  const [, set] = React.useState({});

  return React.useCallback(() => {
    set({});
  }, [set]);
};
