import { IsExact, assert } from "conditional-type-checks";

import { Future } from "./future";

const enqueueTask = (task: () => void) => {
  setTimeout(task, 0);
};

describe("Future", () => {
  describe("creators", () => {
    describe("success", () => {
      it("creates sync success Future", () => {
        const future = Future.success(42);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        future.run({ onSuccess, onFailure });

        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(onFailure).not.toHaveBeenCalled();
      });
    });

    describe("failure", () => {
      it("creates sync failure Future", () => {
        const future = Future.failure("much error!");

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        future.run({ onSuccess, onFailure });

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith("much error!");
      });
    });

    describe("make", () => {
      it("creates sync success Future using resolve cb", () => {
        const getVal = jest.fn().mockReturnValue(42);

        const future = Future.make<number>(({ resolve }) => {
          resolve(getVal());
        });

        expect(getVal).not.toHaveBeenCalled();

        future.run({
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

      it("creates sync failure Future using reject cb", () => {
        const getErr = jest.fn().mockReturnValue("ERR");

        const future = Future.make<number>(({ reject }) => {
          reject(getErr());
        });

        expect(getErr).not.toHaveBeenCalled();

        future.run({
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

      it("creates async success Future using resolve cb", done => {
        const getVal = jest.fn().mockReturnValue(42);

        const future = Future.make<number>(({ resolve }) => {
          enqueueTask(() => {
            resolve(getVal());
          });
        });

        expect(getVal).not.toHaveBeenCalled();

        future.run({
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

      it("creates async failure Future using resolve cb", done => {
        const getErr = jest.fn().mockReturnValue("ERR");

        const future = Future.make<number>(({ reject }) => {
          enqueueTask(() => {
            reject(getErr());
          });
        });

        expect(getErr).not.toHaveBeenCalled();

        future.run({
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
        const future = Future.make<number>(({ resolve, reject }) => {
          resolve(42);
          resolve(24);
          reject("ERR");
        });

        future.run({
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
        const future = Future.make<number>(({ resolve, reject }) => {
          enqueueTask(() => {
            resolve(42);
            enqueueTask(() => {
              resolve(24);
              enqueueTask(() => {
                reject("ERR");
              });
            });
          });
        });

        future.run({
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
        const future = Future.make<number>(() => {
          throw "err";
        });

        expect(() =>
          future.run({
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
      it("creates sync success Future if provided plain value", () => {
        const provider = () => 42;

        const future = Future.from(provider);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        future.run({ onSuccess, onFailure });

        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("creates success Future if provided success Future", () => {
        const provider = () => Future.success(42);

        const future = Future.from(provider);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        future.run({ onSuccess, onFailure });

        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("creates failure Future if provided failure Future", () => {
        const provider = () => Future.failure(666);

        const future = Future.from(provider);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        future.run({ onSuccess, onFailure });

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith(666);
      });

      it("creates success Future if provided resolving Promise", done => {
        const provider = () => Promise.resolve(42);

        const future = Future.from(provider);

        future.run({
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

      it("creates failure Future if provided rejecting Promise", done => {
        const provider = () => Promise.reject(666);

        const future = Future.from(provider);

        future.run({
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

      it("creates failure Future if provider throws", () => {
        const provider = () => {
          throw 666;
        };

        const future = Future.from(provider);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        future.run({ onSuccess, onFailure });

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith(666);
      });
    });

    describe("all", () => {
      it("creates sync success future of empty tuple when called with no input futures", () => {
        const future = Future.all();

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        future.run({ onSuccess, onFailure });

        expect(onSuccess).toHaveBeenCalledWith([]);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("creates future which success type is a tuple and failure type is an union of input types", () => {
        const f1: Future<"T1", "E1"> = Future.success("T1");
        const f2: Future<"T2", "E2"> = Future.success("T2");
        const f3: Future<"T3", "E3"> = Future.success("T3");

        const future = Future.all(f1, f2, f3);

        type Actual = typeof future;
        type Expected = Future<["T1", "T2", "T3"], "E1" | "E2" | "E3">;

        assert<IsExact<Actual, Expected>>(true);
      });

      it("creates sync success future of tuple value from provided sync futures", () => {
        const f1 = Future.success("T1");
        const f2 = Future.success("T2");
        const f3 = Future.success("T3");

        const future = Future.all(f1, f2, f3);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        future.run({ onSuccess, onFailure });

        expect(onSuccess).toHaveBeenCalledWith(["T1", "T2", "T3"]);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("creates async success future of tuple value from provided async futures", done => {
        const f1 = Future.success("T1");
        const f2 = Future.success("T2");
        const f3 = Future.from(() => Promise.resolve("T3"));

        const future = Future.all(f1, f2, f3);
        const spy = jest.fn();

        future.run({
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

      it("creates sync failure future of tuple value from provided sync futures when one fails", () => {
        const f1 = Future.success("T1");
        const f2 = Future.failure("E2");
        const f3 = Future.success("T3");

        const future = Future.all(f1, f2, f3);

        const onSuccess = jest.fn();
        const onFailure = jest.fn();
        future.run({ onSuccess, onFailure });

        expect(onFailure).toHaveBeenCalledWith("E2");
        expect(onSuccess).not.toHaveBeenCalled();
      });

      it("creates async failure future of tuple value from provided async futures when one fails", done => {
        const f1 = Future.success("T1");
        const f2 = Future.from(() => Promise.reject("E2"));
        const f3 = Future.success("T3");

        const future = Future.all(f1, f2, f3);
        const spy = jest.fn();

        future.run({
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
      it("executes onSuccess callback for successful Future", done => {
        const effect = jest.fn();
        const future = Future.make<number>(({ resolve, reject }) => {
          effect();
          enqueueTask(() => {
            resolve(42);
            reject("ERR");
          });
        });

        expect(effect).not.toHaveBeenCalled();

        future.run({
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

      it("executes onFailure callback for successful Future", done => {
        const effect = jest.fn();
        const future = Future.make<number>(({ resolve, reject }) => {
          effect();
          enqueueTask(() => {
            reject("ERR");
            resolve(42);
          });
        });

        expect(effect).not.toHaveBeenCalled();

        future.run({
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

        const future = Future.make<number>(({ resolve }) => {
          effect();
          resolve(42);
        });

        expect(effect).not.toHaveBeenCalled();

        future.run({ onSuccess, onFailure });

        expect(effect).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFailure).not.toHaveBeenCalled();

        future.run({ onSuccess, onFailure });

        expect(effect).toHaveBeenCalledTimes(2);
        expect(onSuccess).toHaveBeenCalledTimes(2);
        expect(onFailure).not.toHaveBeenCalled();
      });
    });

    describe("runPromise", () => {
      it("runs effect and returns resolving Promise for successful Future", async () => {
        const effect = jest.fn();

        const future = Future.make<number>(({ resolve }) => {
          effect();
          resolve(42);
        });

        expect(effect).not.toHaveBeenCalled();

        const promise = future.runPromise();

        expect(effect).toHaveBeenCalled();

        const value = await promise;
        expect(value).toBe(42);
      });

      it("runs effect and returns rejecting Promise for failing Future", async () => {
        const effect = jest.fn();

        const future = Future.make<number>(({ reject }) => {
          effect();
          reject("ERR");
        });

        expect(effect).not.toHaveBeenCalled();

        const promise = future.runPromise();

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
      it("returns new Future with modified success flow using provided mapping function", () => {
        const fn = jest.fn().mockReturnValue(24);
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const future = Future.success(42).map(fn);

        expect(fn).not.toHaveBeenCalled();

        future.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith(42);
        expect(onSuccess).toHaveBeenCalledWith(24);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("success type of returned Future is controlled by return type of mapping function", () => {
        const future = Future.from<"T1", "E">(() => "T1").map(
          _ => "T2" as const
        );

        type Actual = typeof future;
        type Expected = Future<"T2", "E">;

        assert<IsExact<Actual, Expected>>(true);
      });

      it("has no effect for failure flow", () => {
        const fn = jest.fn().mockReturnValue(24);
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const future = Future.failure("err").map(fn);
        future.run({ onSuccess, onFailure });

        expect(fn).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith("err");
      });

      it("does not mutate original Future", () => {
        const fn = jest.fn().mockReturnValue(24);

        const originalFuture = Future.success(42);
        const mappedFuture = originalFuture.map(fn);

        expect(fn).not.toHaveBeenCalled();

        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          originalFuture.run({ onSuccess, onFailure });

          expect(fn).not.toHaveBeenCalled();
          expect(onSuccess).toHaveBeenCalledWith(42);
          expect(onFailure).not.toHaveBeenCalled();
        }
        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          mappedFuture.run({ onSuccess, onFailure });

          expect(fn).toHaveBeenCalledWith(42);
          expect(onSuccess).toHaveBeenCalledWith(24);
          expect(onFailure).not.toHaveBeenCalled();
        }
      });
    });

    describe("flatMap", () => {
      it("returns new Future with modified success flow using provided fn for composition into success flow", () => {
        const fn = jest.fn().mockReturnValue(Future.success(24));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const future = Future.success(42).flatMap(fn);

        expect(fn).not.toHaveBeenCalled();

        future.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith(42);
        expect(onSuccess).toHaveBeenCalledWith(24);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("returns new Future with modified success flow using provided fn for composition into failure flow", () => {
        const fn = jest.fn().mockReturnValue(Future.failure("err"));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const future = Future.success(42).flatMap(fn);

        expect(fn).not.toHaveBeenCalled();

        future.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith(42);
        expect(onFailure).toHaveBeenCalledWith("err");
        expect(onSuccess).not.toHaveBeenCalled();
      });

      it("success and failure types of returned Future are controlled by return type of composition function", () => {
        const f1 = Future.from<"T1", "E1">(() => "T1");
        const f2 = Future.from<"T2", "E2">(() => "T2");

        const future = f1.flatMap(_ => f2);

        type Actual = typeof future;
        type Expected = Future<"T2", "E1" | "E2">;

        assert<IsExact<Actual, Expected>>(true);
      });

      it("has no effect for failure flow of original Future", () => {
        const fn = jest.fn().mockReturnValue(Future.success(24));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const future = Future.failure("err").flatMap(fn);
        future.run({ onSuccess, onFailure });

        expect(fn).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledWith("err");
        expect(onSuccess).not.toHaveBeenCalled();
      });

      it("does not mutate original Future", () => {
        const fn = jest.fn().mockReturnValue(Future.success(24));

        const originalFuture = Future.success(42);
        const mappedFuture = originalFuture.flatMap(fn);

        expect(fn).not.toHaveBeenCalled();

        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          originalFuture.run({ onSuccess, onFailure });

          expect(fn).not.toHaveBeenCalled();
          expect(onSuccess).toHaveBeenCalledWith(42);
          expect(onFailure).not.toHaveBeenCalled();
        }
        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          mappedFuture.run({ onSuccess, onFailure });

          expect(fn).toHaveBeenCalledWith(42);
          expect(onSuccess).toHaveBeenCalledWith(24);
          expect(onFailure).not.toHaveBeenCalled();
        }
      });
    });

    describe("mapErr", () => {
      it("returns new Future with modified failure flow using provided mapping function", () => {
        const fn = jest.fn().mockReturnValue("err2");
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const future = Future.failure("err1").mapErr(fn);

        expect(fn).not.toHaveBeenCalled();

        future.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith("err1");
        expect(onFailure).toHaveBeenCalledWith("err2");
        expect(onSuccess).not.toHaveBeenCalled();
      });

      it("failure type of returned Future is controlled by return type of mapping function", () => {
        const future = Future.from<"T", "E1">(() => {
          throw "E1";
        }).mapErr(_ => "E2" as const);

        type Actual = typeof future;
        type Expected = Future<"T", "E2">;

        assert<IsExact<Actual, Expected>>(true);
      });

      it("has no effect for success flow", () => {
        const fn = jest.fn().mockReturnValue("err2");
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const future = Future.success(42).mapErr(fn);
        future.run({ onSuccess, onFailure });

        expect(fn).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("does not mutate original Future", () => {
        const fn = jest.fn().mockReturnValue("err2");

        const originalFuture = Future.failure("err1");
        const mappedFuture = originalFuture.mapErr(fn);

        expect(fn).not.toHaveBeenCalled();

        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          originalFuture.run({ onSuccess, onFailure });

          expect(fn).not.toHaveBeenCalled();
          expect(onFailure).toHaveBeenCalledWith("err1");
          expect(onSuccess).not.toHaveBeenCalled();
        }
        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          mappedFuture.run({ onSuccess, onFailure });

          expect(fn).toHaveBeenCalledWith("err1");
          expect(onFailure).toHaveBeenCalledWith("err2");
          expect(onSuccess).not.toHaveBeenCalled();
        }
      });
    });

    describe("flatMapErr", () => {
      it("returns new Future with modified failure flow using provided fn for composition into success flow", () => {
        const fn = jest.fn().mockReturnValue(Future.success(24));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const future = Future.failure("err").flatMapErr(fn);

        expect(fn).not.toHaveBeenCalled();

        future.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith("err");
        expect(onSuccess).toHaveBeenCalledWith(24);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("returns new Future with modified failure flow using provided fn for composition into failure flow", () => {
        const fn = jest.fn().mockReturnValue(Future.failure("err2"));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const future = Future.failure("err1").flatMapErr(fn);

        expect(fn).not.toHaveBeenCalled();

        future.run({ onSuccess, onFailure });

        expect(fn).toHaveBeenCalledWith("err1");
        expect(onFailure).toHaveBeenCalledWith("err2");
        expect(onSuccess).not.toHaveBeenCalled();
      });

      it("success and failure types of returned Future are controlled by return type of composition function", () => {
        const f1 = Future.from<"T1", "E1">(() => "T1");
        const f2 = Future.from<"T2", "E2">(() => "T2");

        const future = f1.flatMapErr(_ => f2);

        type Actual = typeof future;
        type Expected = Future<"T1" | "T2", "E2">;

        assert<IsExact<Actual, Expected>>(true);
      });

      it("has no effect for success flow of original Future", () => {
        const fn = jest.fn().mockReturnValue(Future.success(24));
        const onSuccess = jest.fn();
        const onFailure = jest.fn();

        const future = Future.success(42).flatMapErr(fn);
        future.run({ onSuccess, onFailure });

        expect(fn).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(onFailure).not.toHaveBeenCalled();
      });

      it("does not mutate original Future", () => {
        const fn = jest.fn().mockReturnValue(Future.success(24));

        const originalFuture = Future.failure("err");
        const mappedFuture = originalFuture.flatMapErr(fn);

        expect(fn).not.toHaveBeenCalled();

        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          originalFuture.run({ onSuccess, onFailure });

          expect(fn).not.toHaveBeenCalled();
          expect(onFailure).toHaveBeenCalledWith("err");
          expect(onSuccess).not.toHaveBeenCalled();
        }
        {
          const onSuccess = jest.fn();
          const onFailure = jest.fn();
          mappedFuture.run({ onSuccess, onFailure });

          expect(fn).toHaveBeenCalledWith("err");
          expect(onSuccess).toHaveBeenCalledWith(24);
          expect(onFailure).not.toHaveBeenCalled();
        }
      });
    });
  });
});
