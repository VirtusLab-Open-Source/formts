/**
 * Alternative Promise implementation:
 *  - allows for keeping code synchronous until async is actually needed
 *  - delayed execution
 *  - monadic API
 *  - typed error
 */
export class Task<T, Err = unknown> {
  // @ts-ignore
  static success(): Task<void, never>;
  static success<T>(val: T): Task<T, never>;
  static success<T>(val: T) {
    return Task.make<T, never>(({ resolve }) => {
      resolve(val);
    });
  }

  static failure<Err>(err: Err) {
    return Task.make<never, Err>(({ reject }) => {
      reject(err);
    });
  }

  static make<T, Err = unknown>(exec: Executor<T, Err>): Task<T, Err> {
    return new Task(exec);
  }

  static from<T, Err>(provider: () => Task<T, Err> | Promise<T> | T) {
    return Task.make<T, Err>(({ resolve, reject }) => {
      try {
        const it = provider();
        if (isPromise(it)) {
          it.then(resolve, reject);
        } else if (it instanceof Task) {
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
   * Combine several tasks into one
   * which runs all provided tasks in parallel.
   * It will fail if any of the tasks fail.
   */
  static all<TasksArr extends Task<any, any>[]>(
    ...tasks: TasksArr
  ): Task<TaskValuesTuple<TasksArr>, TaskErrorUnion<TasksArr>> {
    return Task.make(({ resolve, reject }) => {
      const results: TaskValuesTuple<TasksArr> = [] as any;
      const completed: true[] = [];

      if (tasks.length === 0) {
        resolve(results);
      }

      const resolveIfReady = () => {
        if (tasks.every((_, i) => completed[i])) {
          resolve(results);
        }
      };

      tasks.forEach((task, i) => {
        task.run({
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

  map<Q>(fn: (val: T) => Q): Task<Q, Err> {
    return Task.make(({ resolve, reject }) => {
      this.run({
        onSuccess: val => {
          resolve(fn(val));
        },
        onFailure: reject,
      });
    });
  }

  flatMap<Q, Err2>(fn: (val: T) => Task<Q, Err2>): Task<Q, Err | Err2> {
    return Task.make(({ resolve, reject }) => {
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

  mapErr<Err2>(fn: (err: Err) => Err2): Task<T, Err2> {
    return Task.make(({ resolve, reject }) => {
      this.run({
        onSuccess: resolve,
        onFailure: err => {
          reject(fn(err));
        },
      });
    });
  }

  flatMapErr<Q, Err2>(fn: (err: Err) => Task<Q, Err2>): Task<T | Q, Err2> {
    return Task.make(({ resolve, reject }) => {
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

type TaskTuple<Values extends readonly any[], Err> = {
  [Index in keyof Values]: Task<Values[Index], Err>;
};

type TaskValuesTuple<TasksArr extends Task<any, any>[]> = TasksArr extends [
  ...TaskTuple<infer Values, any>
]
  ? Values
  : never;

type TaskErrorUnion<TTasks extends Task<any, any>[]> = TTasks extends Task<
  any,
  infer Err
>[]
  ? Err
  : never;

const isPromise = (val: unknown): val is Promise<unknown> =>
  val != null && typeof (val as any).then === "function";
