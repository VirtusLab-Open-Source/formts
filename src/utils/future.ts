/**
 * Alternative Promise implementation:
 *  - allows for keeping code synchronous until async is actually needed
 *  - delayed execution
 *  - monadic API
 *  - typed error
 */
export class Future<T, Err = unknown> {
  // @ts-ignore
  static success(): Future<void, never>;
  static success<T>(val: T): Future<T, never>;
  static success<T>(val: T) {
    return Future.make<T, never>(({ resolve }) => {
      resolve(val);
    });
  }

  static failure<Err>(err: Err) {
    return Future.make<never, Err>(({ reject }) => {
      reject(err);
    });
  }

  static make<T, Err = unknown>(exec: Executor<T, Err>): Future<T, Err> {
    return new Future(exec);
  }

  static from<T, Err>(provider: () => Future<T, Err> | Promise<T> | T) {
    return Future.make<T, Err>(({ resolve, reject }) => {
      try {
        const it = provider();
        if (isPromise(it)) {
          it.then(resolve, reject);
        } else if (it instanceof Future) {
          it.run({ onSuccess: resolve, onFailure: reject });
        } else {
          resolve(it);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Combine several futures into one
   * which runs all provided futures in parallel.
   * It will fail if any of the futures fail.
   */
  static all<TFutures extends Future<any, any>[]>(
    ...futures: TFutures
  ): Future<FutureValuesTuple<TFutures>, FutureErrorUnion<TFutures>> {
    return Future.make(({ resolve, reject }) => {
      const results: FutureValuesTuple<TFutures> = [] as any;
      const completed: true[] = [];

      if (futures.length === 0) {
        resolve(results);
      }

      const resolveIfReady = () => {
        if (futures.every((_, i) => completed[i])) {
          resolve(results);
        }
      };

      futures.forEach((future, i) => {
        future.run({
          onSuccess: val => {
            results[i] = val;
            completed[i] = true;
            resolveIfReady();
          },
          onFailure: reject,
        });
      });
    });
  }

  private constructor(private readonly exec: Executor<T, Err>) {}

  run(handlers: {
    onSuccess: (val: T) => void;
    onFailure: (err: Err) => void;
  }): void {
    let isComplete = false;

    this.exec({
      resolve: val => {
        if (!isComplete) {
          handlers.onSuccess(val);
          isComplete = true;
        }
      },
      reject: err => {
        if (!isComplete) {
          handlers.onFailure(err);
          isComplete = true;
        }
      },
    });
  }

  runPromise(): Promise<T> {
    return new Promise((onSuccess, onFailure) => {
      this.run({ onSuccess, onFailure });
    });
  }

  map<Q>(fn: (val: T) => Q): Future<Q, Err> {
    return Future.make(({ resolve, reject }) => {
      this.run({
        onSuccess: val => {
          resolve(fn(val));
        },
        onFailure: reject,
      });
    });
  }

  flatMap<Q, Err2>(fn: (val: T) => Future<Q, Err2>): Future<Q, Err | Err2> {
    return Future.make(({ resolve, reject }) => {
      this.run({
        onSuccess: val => {
          fn(val).run({
            onSuccess: resolve,
            onFailure: reject,
          });
        },
        onFailure: reject,
      });
    });
  }

  mapErr<Err2>(fn: (err: Err) => Err2): Future<T, Err2> {
    return Future.make(({ resolve, reject }) => {
      this.run({
        onSuccess: resolve,
        onFailure: err => {
          reject(fn(err));
        },
      });
    });
  }

  flatMapErr<Q, Err2>(fn: (err: Err) => Future<Q, Err2>): Future<T | Q, Err2> {
    return Future.make(({ resolve, reject }) => {
      this.run({
        onSuccess: resolve,
        onFailure: err => {
          fn(err).run({
            onSuccess: resolve,
            onFailure: reject,
          });
        },
      });
    });
  }
}

type Executor<T, Err> = (handlers: {
  resolve: (val: T) => void;
  reject: (err: Err) => void;
}) => void;

type FutureTuple<Values extends readonly any[], Err> = {
  [Index in keyof Values]: Future<Values[Index], Err>;
};

type FutureValuesTuple<TFutures extends Future<any, any>[]> = TFutures extends [
  ...FutureTuple<infer Values, any>
]
  ? Values
  : never;

type FutureErrorUnion<
  TFutures extends Future<any, any>[]
> = TFutures extends Future<any, infer Err>[] ? Err : never;

const isPromise = (val: unknown): val is Promise<unknown> =>
  val != null && typeof (val as any).then === "function";
