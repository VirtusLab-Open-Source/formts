import { IsExact, assert } from "conditional-type-checks";

import { Task } from "./task";

const enqueueEffect = (effect: () => void) => {
  setTimeout(effect, 0);
};

describe("Task", () => {
  describe("creators", () => {
    describe("success", () => {
      it("creates sync success Task", () => {
        const task = Task.success(42);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        task.run({ onSuccess, onFailure });

        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(onFailure).not.toHaveBeenCalled();
      });
    });

    describe("failure", () => {
      it("creates sync failure Task", () => {
        const task = Task.failure("much error!");

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        task.run({ onSuccess, onFailure });

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith("much error!");
      });
    });

    describe("make", () => {
      it("creates sync success Task using resolve cb", () => {
        const getVal = jest.fn().mockReturnValue(42);

        const task = Task.make<number>(({ resolve }) => {
          resolve(getVal());
        });

        expect(getVal).not.toHaveBeenCalled();

        task.run({
          onSuccess: val => {
            expect(val).toBe(42);
          },
          onFailure: () => {
            fail("expected onFailure not to be called");
          },
        });

        expect(getVal).toHaveBeenCalled();
        expect.assertions(3);
      });

      it("creates sync failure Task using reject cb", () => {
        const getErr = jest.fn().mockReturnValue("ERR");

        const task = Task.make<number>(({ reject }) => {
          reject(getErr());
        });

        expect(getErr).not.toHaveBeenCalled();

        task.run({
          onSuccess: () => {
            fail("expected onSuccess not to be called");
          },
          onFailure: err => {
            expect(err).toBe("ERR");
          },
        });

        expect(getErr).toHaveBeenCalled();
        expect.assertions(3);
      });

      it("creates async success Task using resolve cb", done => {
        const getVal = jest.fn().mockReturnValue(42);

        const task = Task.make<number>(({ resolve }) => {
          enqueueEffect(() => {
            resolve(getVal());
          });
        });

        expect(getVal).not.toHaveBeenCalled();

        task.run({
          onSuccess: val => {
            expect(val).toBe(42);
            expect(getVal).toHaveBeenCalled();
            done();
          },
          onFailure: () => {
            fail("expected onFailure not to be called");
          },
        });

        expect(getVal).not.toHaveBeenCalled();

        expect.assertions(4);
      });

      it("creates async failure Task using resolve cb", done => {
        const getErr = jest.fn().mockReturnValue("ERR");

        const task = Task.make<number>(({ reject }) => {
          enqueueEffect(() => {
            reject(getErr());
          });
        });

        expect(getErr).not.toHaveBeenCalled();

        task.run({
          onSuccess: () => {
            fail("expected onSuccess not to be called");
          },
          onFailure: err => {
            expect(err).toBe("ERR");
            expect(getErr).toHaveBeenCalled();
            done();
          },
        });

        expect(getErr).not.toHaveBeenCalled();
        expect.assertions(4);
      });

      it("ignores any extra sync calls of resolve/reject cb", () => {
        const task = Task.make<number>(({ resolve, reject }) => {
          resolve(42);
          resolve(24);
          reject("ERR");
        });

        task.run({
          onSuccess: val => {
            expect(val).toBe(42);
          },
          onFailure: () => {
            fail("expected onFailure not to be called");
          },
        });

        expect.assertions(1);
      });

      it("ignores any extra async calls of resolve/reject cb", done => {
        const task = Task.make<number>(({ resolve, reject }) => {
          enqueueEffect(() => {
            resolve(42);
            enqueueEffect(() => {
              resolve(24);
              enqueueEffect(() => {
                reject("ERR");
              });
            });
          });
        });

        task.run({
          onSuccess: val => {
            expect(val).toBe(42);
            done();
          },
          onFailure: () => {
            fail("expected onFailure not to be called");
          },
        });

        expect.assertions(1);
      });

      it("throws if make cb function throws", () => {
        const task = Task.make<number>(() => {
          throw "err";
        });

        expect(() =>
          task.run({
            onSuccess: () => {
              fail("expected onSuccess not to be called");
            },
            onFailure: () => {
              fail("expected onFailure not to be called");
            },
          })
        ).toThrow("err");
      });
    });

    describe("from", () => {
      it("creates sync success Task if provided plain value", () => {
        const provider = () => 42;

        const task = Task.from(provider);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        task.run({ onSuccess, onFailure });

        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("creates success Task if provided success Task", () => {
        const provider = () => Task.success(42);

        const task = Task.from(provider);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        task.run({ onSuccess, onFailure });

        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("creates failure Task if provided failure Task", () => {
        const provider = () => Task.failure(666);

        const task = Task.from(provider);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        task.run({ onSuccess, onFailure });

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith(666);
      });

      it("creates success Task if provided resolving Promise", done => {
        const provider = () => Promise.resolve(42);

        const task = Task.from(provider);

        task.run({
          onSuccess: val => {
            expect(val).toBe(42);
            done();
          },
          onFailure: () => {
            fail("expected onFailure not to be called");
          },
        });

        expect.assertions(1);
      });

      it("creates failure Task if provided rejecting Promise", done => {
        const provider = () => Promise.reject(666);

        const task = Task.from(provider);

        task.run({
          onSuccess: () => {
            fail("expected onSuccess not to be called");
          },
          onFailure: err => {
            expect(err).toBe(666);
            done();
          },
        });

        expect.assertions(1);
      });

      it("creates failure Task if provider throws", () => {
        const provider = () => {
          throw 666;
        };

        const task = Task.from(provider);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        task.run({ onSuccess, onFailure });

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith(666);
      });
    });

    describe("all", () => {
      it("creates sync success task of empty tuple when called with no input tasks", () => {
        const task = Task.all();

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        task.run({ onSuccess, onFailure });

        expect(onSuccess).toHaveBeenCalledWith([]);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("creates task which success type is a tuple and failure type is an union of input types", () => {
        const t1: Task<"T1", "E1"> = Task.success("T1");
        const t2: Task<"T2", "E2"> = Task.success("T2");
        const t3: Task<"T3", "E3"> = Task.success("T3");

        const task = Task.all(t1, t2, t3);

        type Actual = typeof task;
        type Expected = Task<["T1", "T2", "T3"], "E1" | "E2" | "E3">;

        assert<IsExact<Actual, Expected>>(true);
      });

      it("creates sync success task of tuple value from provided sync tasks", () => {
        const t1 = Task.success("T1");
        const t2 = Task.success("T2");
        const t3 = Task.success("T3");

        const task = Task.all(t1, t2, t3);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        task.run({ onSuccess, onFailure });

        expect(onSuccess).toHaveBeenCalledWith(["T1", "T2", "T3"]);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("creates async success task of tuple value from provided async tasks", done => {
        const t1 = Task.success("T1");
        const t2 = Task.success("T2");
        const t3 = Task.from(() => Promise.resolve("T3"));

        const task = Task.all(t1, t2, t3);
        const spy = jest.fn();

        task.run({
          onSuccess: val => {
            spy();
            expect(val).toEqual(["T1", "T2", "T3"]);
            done();
          },
          onFailure: () => {
            fail("expected onFailure not to be called");
          },
        });

        expect(spy).not.toHaveBeenCalled();
        expect.assertions(2);
      });

      it("creates sync failure task of tuple value from provided sync tasks when one fails", () => {
        const t1 = Task.success("T1");
        const t2 = Task.failure("E2");
        const t3 = Task.success("T3");

        const task = Task.all(t1, t2, t3);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        task.run({ onSuccess, onFailure });

        expect(onFailure).toHaveBeenCalledWith("E2");
        expect(onSuccess).not.toHaveBeenCalled();
      });

      it("creates async failure task of tuple value from provided async tasks when one fails", done => {
        const t1 = Task.success("T1");
        const t2 = Task.from(() => Promise.reject("E2"));
        const t3 = Task.success("T3");

        const task = Task.all(t1, t2, t3);
        const spy = jest.fn();

        task.run({
          onSuccess: () => {
            fail("expected onSuccess not to be called");
          },
          onFailure: err => {
            spy();
            expect(err).toBe("E2");
            done();
          },
        });

        expect(spy).not.toHaveBeenCalled();
        expect.assertions(2);
      });
    });
  });

  describe("methods", () => {
    describe("run", () => {
      it("executes onSuccess callback for successful Task", done => {
        const effect = jest.fn();
        const task = Task.make<number>(({ resolve, reject }) => {
          effect();
          enqueueEffect(() => {
            resolve(42);
            reject("ERR");
          });
        });

        expect(effect).not.toHaveBeenCalled();

        task.run({
          onSuccess: val => {
            expect(val).toBe(42);
            done();
          },
          onFailure: () => {
            fail("expected onFailure not to be called");
          },
        });

        expect(effect).toHaveBeenCalled();

        expect.assertions(3);
      });

      it("executes onFailure callback for successful Task", done => {
        const effect = jest.fn();
        const task = Task.make<number>(({ resolve, reject }) => {
          effect();
          enqueueEffect(() => {
            reject("ERR");
            resolve(42);
          });
        });

        expect(effect).not.toHaveBeenCalled();

        task.run({
          onSuccess: () => {
            fail("expected onSuccess not to be called");
          },
          onFailure: err => {
            expect(err).toBe("ERR");
            done();
          },
        });

        expect(effect).toHaveBeenCalled();

        expect.assertions(3);
      });

      it("can be called multiple times to cause multiple effects", () => {
        const effect = jest.fn();
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const task = Task.make<number>(({ resolve }) => {
          effect();
          resolve(42);
        });

        expect(effect).not.toHaveBeenCalled();

        task.run({ onSuccess, onFailure });

        expect(effect).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();

        task.run({ onSuccess, onFailure });

        expect(effect).toHaveBeenCalledTimes(2);
        expect(onSuccess).toHaveBeenCalledTimes(2);
        expect(onFailure).not.toHaveBeenCalled();
      });
    });

    describe("runPromise", () => {
      it("runs effect and returns resolving Promise for successful Task", async () => {
        const effect = jest.fn();

        const task = Task.make<number>(({ resolve }) => {
          effect();
          resolve(42);
        });

        expect(effect).not.toHaveBeenCalled();

        const promise = task.runPromise();

        expect(effect).toHaveBeenCalled();

        const value = await promise;
        expect(value).toBe(42);
      });

      it("runs effect and returns rejecting Promise for failing Task", async () => {
        const effect = jest.fn();

        const task = Task.make<number>(({ reject }) => {
          effect();
          reject("ERR");
        });

        expect(effect).not.toHaveBeenCalled();

        const promise = task.runPromise();

        expect(effect).toHaveBeenCalled();

        try {
          await promise;
        } catch (err) {
          expect(err).toBe("ERR");
        }

        expect.assertions(3);
      });
    });

    describe("map", () => {
      it("returns new Task with modified success flow using provided mapping function", () => {
        const fn = jest.fn().mockReturnValue(24);
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const task = Task.success(42).map(fn);

        expect(fn).not.toHaveBeenCalled();

        task.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith(42);
        expect(onSuccess).toHaveBeenCalledWith(24);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("success type of returned Task is controlled by return type of mapping function", () => {
        const task = Task.from<"T1", "E">(() => "T1").map(_ => "T2" as const);

        type Actual = typeof task;
        type Expected = Task<"T2", "E">;

        assert<IsExact<Actual, Expected>>(true);
      });

      it("has no effect for failure flow", () => {
        const fn = jest.fn().mockReturnValue(24);
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const task = Task.failure("err").map(fn);
        task.run({ onSuccess, onFailure });

        expect(fn).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith("err");
      });

      it("does not mutate original Task", () => {
        const fn = jest.fn().mockReturnValue(24);

        const originalTask = Task.success(42);
        const mappedTask = originalTask.map(fn);

        expect(fn).not.toHaveBeenCalled();

        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          originalTask.run({ onSuccess, onFailure });

          expect(fn).not.toHaveBeenCalled();
          expect(onSuccess).toHaveBeenCalledWith(42);
          expect(onFailure).not.toHaveBeenCalled();
        }
        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          mappedTask.run({ onSuccess, onFailure });

          expect(fn).toHaveBeenCalledWith(42);
          expect(onSuccess).toHaveBeenCalledWith(24);
          expect(onFailure).not.toHaveBeenCalled();
        }
      });
    });

    describe("flatMap", () => {
      it("returns new Task with modified success flow using provided fn for composition into success flow", () => {
        const fn = jest.fn().mockReturnValue(Task.success(24));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const task = Task.success(42).flatMap(fn);

        expect(fn).not.toHaveBeenCalled();

        task.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith(42);
        expect(onSuccess).toHaveBeenCalledWith(24);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("returns new Task with modified success flow using provided fn for composition into failure flow", () => {
        const fn = jest.fn().mockReturnValue(Task.failure("err"));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const task = Task.success(42).flatMap(fn);

        expect(fn).not.toHaveBeenCalled();

        task.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith(42);
        expect(onFailure).toHaveBeenCalledWith("err");
        expect(onSuccess).not.toHaveBeenCalled();
      });

      it("success and failure types of returned Task are controlled by return type of composition function", () => {
        const t1 = Task.from<"T1", "E1">(() => "T1");
        const t2 = Task.from<"T2", "E2">(() => "T2");

        const task = t1.flatMap(_ => t2);

        type Actual = typeof task;
        type Expected = Task<"T2", "E1" | "E2">;

        assert<IsExact<Actual, Expected>>(true);
      });

      it("has no effect for failure flow of original Task", () => {
        const fn = jest.fn().mockReturnValue(Task.success(24));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const task = Task.failure("err").flatMap(fn);
        task.run({ onSuccess, onFailure });

        expect(fn).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith("err");
        expect(onSuccess).not.toHaveBeenCalled();
      });

      it("does not mutate original Task", () => {
        const fn = jest.fn().mockReturnValue(Task.success(24));

        const originalTask = Task.success(42);
        const mappedTask = originalTask.flatMap(fn);

        expect(fn).not.toHaveBeenCalled();

        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          originalTask.run({ onSuccess, onFailure });

          expect(fn).not.toHaveBeenCalled();
          expect(onSuccess).toHaveBeenCalledWith(42);
          expect(onFailure).not.toHaveBeenCalled();
        }
        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          mappedTask.run({ onSuccess, onFailure });

          expect(fn).toHaveBeenCalledWith(42);
          expect(onSuccess).toHaveBeenCalledWith(24);
          expect(onFailure).not.toHaveBeenCalled();
        }
      });
    });

    describe("mapErr", () => {
      it("returns new Task with modified failure flow using provided mapping function", () => {
        const fn = jest.fn().mockReturnValue("err2");
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const task = Task.failure("err1").mapErr(fn);

        expect(fn).not.toHaveBeenCalled();

        task.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith("err1");
        expect(onFailure).toHaveBeenCalledWith("err2");
        expect(onSuccess).not.toHaveBeenCalled();
      });

      it("failure type of returned Task is controlled by return type of mapping function", () => {
        const task = Task.from<"T", "E1">(() => {
          throw "E1";
        }).mapErr(_ => "E2" as const);

        type Actual = typeof task;
        type Expected = Task<"T", "E2">;

        assert<IsExact<Actual, Expected>>(true);
      });

      it("has no effect for success flow", () => {
        const fn = jest.fn().mockReturnValue("err2");
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const task = Task.success(42).mapErr(fn);
        task.run({ onSuccess, onFailure });

        expect(fn).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("does not mutate original Task", () => {
        const fn = jest.fn().mockReturnValue("err2");

        const originalTask = Task.failure("err1");
        const mappedTask = originalTask.mapErr(fn);

        expect(fn).not.toHaveBeenCalled();

        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          originalTask.run({ onSuccess, onFailure });

          expect(fn).not.toHaveBeenCalled();
          expect(onFailure).toHaveBeenCalledWith("err1");
          expect(onSuccess).not.toHaveBeenCalled();
        }
        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          mappedTask.run({ onSuccess, onFailure });

          expect(fn).toHaveBeenCalledWith("err1");
          expect(onFailure).toHaveBeenCalledWith("err2");
          expect(onSuccess).not.toHaveBeenCalled();
        }
      });
    });

    describe("flatMapErr", () => {
      it("returns new Task with modified failure flow using provided fn for composition into success flow", () => {
        const fn = jest.fn().mockReturnValue(Task.success(24));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const task = Task.failure("err").flatMapErr(fn);

        expect(fn).not.toHaveBeenCalled();

        task.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith("err");
        expect(onSuccess).toHaveBeenCalledWith(24);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("returns new Task with modified failure flow using provided fn for composition into failure flow", () => {
        const fn = jest.fn().mockReturnValue(Task.failure("err2"));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const task = Task.failure("err1").flatMapErr(fn);

        expect(fn).not.toHaveBeenCalled();

        task.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith("err1");
        expect(onFailure).toHaveBeenCalledWith("err2");
        expect(onSuccess).not.toHaveBeenCalled();
      });

      it("success and failure types of returned Task are controlled by return type of composition function", () => {
        const t1 = Task.from<"T1", "E1">(() => "T1");
        const t2 = Task.from<"T2", "E2">(() => "T2");

        const task = t1.flatMapErr(_ => t2);

        type Actual = typeof task;
        type Expected = Task<"T1" | "T2", "E2">;

        assert<IsExact<Actual, Expected>>(true);
      });

      it("has no effect for success flow of original Task", () => {
        const fn = jest.fn().mockReturnValue(Task.success(24));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const task = Task.success(42).flatMapErr(fn);
        task.run({ onSuccess, onFailure });

        expect(fn).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("does not mutate original Task", () => {
        const fn = jest.fn().mockReturnValue(Task.success(24));

        const originalTask = Task.failure("err");
        const mappedTask = originalTask.flatMapErr(fn);

        expect(fn).not.toHaveBeenCalled();

        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          originalTask.run({ onSuccess, onFailure });

          expect(fn).not.toHaveBeenCalled();
          expect(onFailure).toHaveBeenCalledWith("err");
          expect(onSuccess).not.toHaveBeenCalled();
        }
        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          mappedTask.run({ onSuccess, onFailure });

          expect(fn).toHaveBeenCalledWith("err");
          expect(onSuccess).toHaveBeenCalledWith(24);
          expect(onFailure).not.toHaveBeenCalled();
        }
      });
    });
  });
});
