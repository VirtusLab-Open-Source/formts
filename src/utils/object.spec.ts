import { deepMerge, deepEqual, get, set, filter } from "./object";

describe("filter", () => {
  it("returns object with filtered out properties", () => {
    const object = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      x: 42,
    };

    expect(
      filter(object, ({ key, value }) => value < 3 || key === "x")
    ).toEqual({
      a: 1,
      b: 2,
      x: 42,
    });
  });
});

describe("get", () => {
  it("empty path should return origin ", () => {
    expect(get({}, "")).toEqual({});
    expect(get([1, 2, 3], "")).toEqual([1, 2, 3]);
    expect(get({ a: "a" }, "")).toEqual({ a: "a" });
  });

  it("should return undefined for empty object despite the path", () => {
    ["a", "a.b", "[0]"].forEach(path =>
      expect(get({}, path)).toEqual(undefined)
    );
  });

  it("should return values for array", () => {
    const array = [0, 1, 2];
    expect(get(array, "[0]")).toEqual(0);
    expect(get(array, "[1]")).toEqual(1);
    expect(get(array, "[2]")).toEqual(2);
    expect(get(array, "[3]")).toEqual(undefined);
    expect(get(array, "[10]")).toEqual(undefined);
  });

  it("should return values for 1D object", () => {
    const obj = { a: "a", b: "bb", c: "ccc" };
    expect(get(obj, "a")).toEqual("a");
    expect(get(obj, "b")).toEqual("bb");
    expect(get(obj, "c")).toEqual("ccc");
    expect(get(obj, "d")).toEqual(undefined);
    expect(get(obj, "aaaa")).toEqual(undefined);
  });

  it("should return values for nested object", () => {
    const obj = {
      a: {
        b: {
          c: "ccc",
        },
      },
    };
    expect(get(obj, "a")).toEqual({ b: { c: "ccc" } });
    expect(get(obj, "a.b")).toEqual({ c: "ccc" });
    expect(get(obj, "a.b.c")).toEqual("ccc");
    expect(get(obj, "b")).toEqual(undefined);
    expect(get(obj, "c")).toEqual(undefined);
  });

  it("should return values for nested object/array", () => {
    const obj = {
      a: [{ one: 1 }, { two: 2, more: { secret: "gumisie najlepsze!" } }],
    };
    expect(get(obj, "a")).toEqual(obj.a);
    expect(get(obj, "a[0]")).toEqual(obj.a[0]);
    expect(get(obj, "a[0].one")).toEqual(1);
    expect(get(obj, "a[1]")).toEqual(obj.a[1]);
    expect(get(obj, "a[1].two")).toEqual(2);
    expect(get(obj, "a[1].more")).toEqual({ secret: "gumisie najlepsze!" });
    expect(get(obj, "a[1].more.secret")).toEqual("gumisie najlepsze!");
    expect(get(obj, "a[2]")).toEqual(undefined);
    expect(get(obj, "a.b")).toEqual(undefined);
  });
});

describe("set", () => {
  it("should set value to empty object", () => {
    expect(set({}, "a", "aaa")).toEqual({ a: "aaa" });
  });

  it("should set nested value to empty object", () => {
    expect(set({}, "a.b", "aaa")).toEqual({ a: { b: "aaa" } });
  });

  it("should set value to empty array", () => {
    expect(set([], "[0]", "aaa")).toEqual(["aaa"]);
  });

  it("should set nested value to array", () => {
    expect(set([], "[0].[0]", "aaa")).toEqual([{ 0: "aaa" }]);
  });

  it("should set value to array out of scope", () => {
    expect(set([0], "[2]", "aaa")).toEqual([0, undefined, "aaa"]);
  });

  it("should set value to existing field", () => {
    expect(set({ a: "a" }, "a", "aaa")).toEqual({ a: "aaa" });
  });

  it("should set value to existing field of nested object", () => {
    expect(set({ a: { b: "b" } }, "a.b", "bbb")).toEqual({ a: { b: "bbb" } });
  });

  it("should set value to non-existing field of nested object", () => {
    expect(set({ a: { b: "b" } }, "a.c", "ccc")).toEqual({
      a: { b: "b", c: "ccc" },
    });
  });

  it("should set value to nested array", () => {
    expect(set([[1], [2], [3]], "[2][0]", 11)).toEqual([[1], [2], [11]]);
  });

  it("should set value to nested array out of range", () => {
    expect(set([[1], [2], [3]], "[2][1]", 11)).toEqual([[1], [2], [3, 11]]);
  });

  it("should set value to nested array/object", () => {
    expect(
      set({ a: [1, 2, { b: "bb", c: [10, 20] }], aa: 1 }, "a[2].c[1]", 200)
    ).toEqual({ a: [1, 2, { b: "bb", c: [10, 200] }], aa: 1 });
  });

  it("preserves structural sharing", () => {
    const original = {
      left: { a: { id: 1 }, b: { id: 2 } },
      right: { a: { id: 3 }, b: { id: 4 } },
    };
    const updated = set(original, "right.b.id", 10);

    expect(original).not.toBe(updated);
    expect(original.right).not.toBe(updated.right);
    expect(original.right.b).not.toBe(updated.right.b);
    expect(original.right.a).toBe(updated.right.a);
    expect(original.left).toBe(updated.left);
  });
});

describe("deepMerge", () => {
  it("1D object", () => {
    expect(deepMerge({ a: "origin-a", b: 10 }, { a: "merge-a" })).toEqual({
      a: "merge-a",
      b: 10,
    });
  });

  it("2D object", () => {
    expect(
      deepMerge(
        {
          a: {
            b: { c: "origin-c", d: "origin-d" },
            e: true,
          },
        },
        { a: { b: { d: "merge-d" }, e: false } }
      )
    ).toEqual({
      a: {
        b: { c: "origin-c", d: "merge-d" },
        e: false,
      },
    });
  });

  it("2D object with arrays", () => {
    expect(
      deepMerge(
        {
          a: {
            b: { c: "origin-c", d: "origin-d" },
            e: [1, 2, 3],
          },
        },
        { a: { e: [10, 20, 30] } }
      )
    ).toEqual({
      a: { b: { c: "origin-c", d: "origin-d" }, e: [10, 20, 30] },
    });
  });

  it("2D object with override", () => {
    expect(
      deepMerge(
        {
          a: {
            b: { c: "origin-c", d: "origin-d" },
            e: [1, 2, 3],
          },
          f: "foo",
        },
        { a: "override" }
      )
    ).toEqual({
      a: "override",
      f: "foo",
    });
  });

  it("2D object with nulls", () => {
    expect(
      deepMerge(
        {
          a: {
            b: { c: "origin-c", d: "origin-d" },
            e: [1, 2, 3],
          },
          f: "foo",
        },
        { a: null }
      )
    ).toEqual({
      a: null,
      f: "foo",
    });
  });
});

describe("deepEqual", () => {
  it("should resolve equality for nullable values", () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual({}, undefined)).toBe(false);
    expect(deepEqual([], undefined)).toBe(false);
    expect(deepEqual(false, undefined)).toBe(false);
    expect(deepEqual("", undefined)).toBe(false);
  });

  it("should resolve equality for primitive values", () => {
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(false, true)).toBe(false);

    expect(deepEqual("", "")).toBe(true);
    expect(deepEqual("foo", "foo")).toBe(true);
    expect(deepEqual("foo", "foo ")).toBe(false);

    expect(deepEqual(1.333, 1.333)).toBe(true);
    expect(deepEqual(1.333, 1.332)).toBe(false);
    expect(deepEqual(1.333, "1.333")).toBe(false);
    expect(deepEqual(-1, 1)).toBe(false);
  });

  it("should resolve equality for 0", () => {
    expect(deepEqual(0, 0)).toBe(true);
    expect(deepEqual(-0, +0)).toBe(true);
    expect(deepEqual(+0, -0)).toBe(true);
  });

  it("should resolve equality for NaN", () => {
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual(NaN, Infinity)).toBe(false);
    expect(deepEqual(NaN, 42)).toBe(false);
  });

  it("should resolve equality for objects", () => {
    expect(deepEqual({}, {})).toBe(true);
    expect(deepEqual({ foo: 1 }, {})).toBe(false);
    expect(deepEqual({}, { foo: 1 })).toBe(false);
    expect(deepEqual({ foo: 1 }, { foo: 1 })).toBe(true);
    expect(deepEqual({ foo: 1 }, { foo: 2 })).toBe(false);
    expect(deepEqual({ foo: 1 }, { foo: 1, bar: 2 })).toBe(false);
    expect(deepEqual({ foo: 1, bar: "" }, { foo: 1 })).toBe(false);
    expect(deepEqual({ foo: 1 }, { fooo: 1 })).toBe(false);
  });

  it("should resolve equality for nested objects", () => {
    expect(deepEqual({ a: {} }, { a: {} })).toBe(true);
    expect(deepEqual({ a: {} }, { b: {} })).toBe(false);
    expect(deepEqual({ a: { aa: "" } }, { a: {} })).toBe(false);
    expect(deepEqual({ a: { aa: "" } }, { a: { aa: "" } })).toBe(true);
    expect(deepEqual({ a: { aa: "foo" } }, { a: { aa: "bar" } })).toBe(false);
    expect(deepEqual({ a: { aa: "foo" } }, { a: { bb: "foo" } })).toBe(false);
    expect(deepEqual({ a: { aa: "foo" } }, { a: { bb: "foo" } })).toBe(false);
    expect(deepEqual({ a: { aa: [] } }, { a: { aa: [] } })).toBe(true);
    expect(deepEqual({ a: { aa: [1] } }, { a: { aa: [1] } })).toBe(true);
    expect(deepEqual({ a: { aa: [1] } }, { a: { aa: [2] } })).toBe(false);
    expect(deepEqual({ a: { aa: [1] } }, { a: { aa: [1, 2] } })).toBe(false);
  });

  it("should resolve equality for arrays", () => {
    expect(deepEqual([], [])).toBe(true);
    expect(deepEqual([1], [1])).toBe(true);
    expect(deepEqual([1], [2])).toBe(false);
    expect(deepEqual([1, 2], [1])).toBe(false);
    expect(deepEqual(["a", "b", "c"], ["b", "c", "a"])).toBe(false);
    expect(deepEqual([null], [null])).toBe(true);
    expect(deepEqual(Array(10), Array(10))).toBe(true);
    expect(deepEqual(Array(10), Array(5))).toBe(false);
  });

  it("should resolve equality for arrays with nested objects", () => {
    expect(deepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
    expect(deepEqual([{ a: 1 }], [{ a: 2 }])).toBe(false);
    expect(deepEqual([{ a: 1 }], [{ b: 1 }])).toBe(false);
    expect(deepEqual([{ a: {} }], [{ a: {} }])).toBe(true);
    expect(deepEqual([{ a: {} }], [{ a: { b: [] } }])).toBe(false);
    expect(deepEqual([{ a: { b: [] } }], [{ a: { b: [] } }])).toBe(true);
  });

  it("should resolve equality for Dates", () => {
    const timestamp = new Date().getTime();

    expect(deepEqual(new Date(timestamp), new Date(timestamp))).toBe(true);
    expect(deepEqual(new Date(timestamp), new Date(timestamp + 1))).toBe(false);
    expect(deepEqual(new Date(timestamp), new Date(NaN))).toBe(false);
    expect(deepEqual(new Date(NaN), new Date(NaN))).toBe(true);
  });

  // we do not need to worry about these cases for the purpose of the library
  // it("should resolve equality for class instances");
  // it("should resolve equality for symbols");
});
