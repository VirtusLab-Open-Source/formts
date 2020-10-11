/** useful for avoiding wrapping everything in Promise.resolve which can turn sync code into async */
export const handleMaybePromise = <T>(
  resolver: () => Promise<T> | T,
  handlers: {
    then: (val: T) => void;
    catch: (err: Error) => void;
  }
) => {
  try {
    const result = resolver();
    if (isPromise(result)) {
      result.then(handlers.then).catch(handlers.catch);
    } else {
      handlers.then(result);
    }
  } catch (err) {
    handlers.catch(err);
  }
};

const isPromise = (it: unknown): it is Promise<unknown> =>
  it != null &&
  typeof (it as Promise<unknown>).then === "function" &&
  typeof (it as Promise<unknown>).catch === "function";
