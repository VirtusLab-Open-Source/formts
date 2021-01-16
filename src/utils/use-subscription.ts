import React from "react";

import { Atom } from "./atoms";

type Observable<T> = Atom<T> | Atom.Readonly<T>;

/**
 * rerender component on changes to observable
 */
export const useSubscription = <T>(observable: Observable<T>) => {
  const update = useForceUpdate();

  React.useEffect(() => {
    const sub = observable.subscribe(update);
    return () => observable.unsubscribe(sub);
  }, [observable, update]);
};

const useForceUpdate = () => {
  const [, set] = React.useState({});

  return React.useCallback(() => {
    set({});
  }, [set]);
};
