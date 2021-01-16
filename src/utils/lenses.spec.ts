import { IsExact, assert } from "conditional-type-checks";

import { Lens } from "./lenses";

describe("Lens", () => {
  describe("identity", () => {
    it("get fn returns passed object", () => {
      const obj = { foo: "A", bar: "B" };
      const idLens = Lens.identity<typeof obj>();

      expect(idLens.get(obj)).toBe(obj);
    });

    it("update fn calls setter with provided object", () => {
      const obj = { foo: "A", bar: "B" };
      const idLens = Lens.identity<typeof obj>();
      const setter = jest.fn().mockImplementation(it => it);

      expect(idLens.update(obj, setter)).toBe(obj);
      expect(setter).toBeCalledWith(obj);
    });
  });

  describe("prop", () => {
    it("allows for accessing properties of an object", () => {
      const obj = { foo: "A", bar: "B" };
      type O = typeof obj;

      const atFoo = Lens.prop<O, "foo">("foo");

      expect(atFoo.get(obj)).toBe("A");

      assert<IsExact<ReturnType<typeof atFoo.get>, typeof obj["foo"]>>(true);
    });

    it("allows for immutably setting properties of an object", () => {
      const obj = { foo: 1, bar: "baz" };
      type O = typeof obj;

      const atFoo = Lens.prop<O, "foo">("foo");

      const obj2 = atFoo.update(obj, it => it + 1);
      const obj3 = atFoo.update(obj2, it => it + 10);

      expect(obj).toEqual({ foo: 1, bar: "baz" });
      expect(obj2).toEqual({ foo: 2, bar: "baz" });
      expect(obj3).toEqual({ foo: 12, bar: "baz" });

      assert<IsExact<ReturnType<typeof atFoo.update>, typeof obj>>(true);
    });
  });

  describe("index", () => {
    it("allows for accessing elements of an array", () => {
      const arr = ["a", "b", "c"];
      type A = typeof arr;

      const at1 = Lens.index<A>(1);
      const at5 = Lens.index<A>(5);

      expect(at1.get(arr)).toBe("b");
      expect(at5.get(arr)).toBe(undefined);

      assert<IsExact<ReturnType<typeof at1.get>, typeof arr[1] | undefined>>(
        true
      );
    });

    it("allows for immutably setting elements of an array", () => {
      const arr = ["a", "b", "c"];
      type A = typeof arr;

      const at1 = Lens.index<A>(1);
      const at5 = Lens.index<A>(5);

      const arr2 = at1.update(arr, () => "B");
      const arr3 = at5.update(arr2, () => "D");

      expect(arr).toEqual(["a", "b", "c"]);
      expect(arr2).toEqual(["a", "B", "c"]);
      expect(arr3).toEqual(["a", "B", "c", , , "D"]);

      assert<IsExact<ReturnType<typeof at1.update>, typeof arr>>(true);
    });
  });

  describe("compose", () => {
    it("allows for immutably setting and accessing nested object properties", () => {
      const obj = { foo: { bar: 42 }, baz: "C" };

      const atFooBar = Lens.compose(
        Lens.identity<typeof obj>(),
        Lens.prop("foo"),
        Lens.prop("bar")
      );

      const obj2 = atFooBar.update(obj, () => 666);

      expect(obj).toEqual({ foo: { bar: 42 }, baz: "C" });
      expect(atFooBar.get(obj)).toBe(42);

      expect(obj2).toEqual({ foo: { bar: 666 }, baz: "C" });
      expect(atFooBar.get(obj2)).toBe(666);

      assert<IsExact<ReturnType<typeof atFooBar.get>, number>>(true);
      assert<IsExact<ReturnType<typeof atFooBar.update>, typeof obj>>(true);
    });

    it("allows for immutably setting and accessing deeply nested object properties", () => {
      const obj = { foo: { bar: [1, 2, 3] } };

      const atFooBar1 = Lens.compose(
        Lens.identity<typeof obj>(),
        Lens.prop("foo"),
        Lens.prop("bar"),
        Lens.index(1)
      );

      const obj2 = atFooBar1.update(obj, () => 666);

      expect(obj).toEqual({ foo: { bar: [1, 2, 3] } });
      expect(atFooBar1.get(obj)).toBe(2);

      expect(obj2).toEqual({ foo: { bar: [1, 666, 3] } });
      expect(atFooBar1.get(obj2)).toBe(666);

      assert<IsExact<ReturnType<typeof atFooBar1.get>, number | undefined>>(
        true
      );
      assert<IsExact<ReturnType<typeof atFooBar1.update>, typeof obj>>(true);
    });

    it("allows for immutably setting and accessing very deeply nested object properties", () => {
      const obj = { foo: { bar: { baz: [{ answer: 42 }] } }, other: { a: 1 } };
      const answerLens = Lens.compose(
        Lens.identity<typeof obj>(),
        Lens.prop("foo"),
        Lens.prop("bar"),
        Lens.prop("baz"),
        Lens.index(0),
        Lens.prop("answer")
      );

      const obj2 = answerLens.update(obj, it => (it ? it * 2 : it));

      expect(obj).toEqual({
        foo: { bar: { baz: [{ answer: 42 }] } },
        other: { a: 1 },
      });
      expect(answerLens.get(obj)).toBe(42);

      expect(obj2).toEqual({
        foo: { bar: { baz: [{ answer: 84 }] } },
        other: { a: 1 },
      });
      expect(answerLens.get(obj2)).toBe(84);

      assert<IsExact<ReturnType<typeof answerLens.get>, number | undefined>>(
        true
      );
      assert<IsExact<ReturnType<typeof answerLens.update>, typeof obj>>(true);
    });

    it("allows for immutably setting and accessing very deeply nested optional object properties", () => {
      type O = {
        foo?: { bar: { baz: Array<{ answer: number }> } };
      };
      const obj: O = { foo: undefined };

      const foobarLens = Lens.compose(
        Lens.identity<typeof obj>(),
        Lens.prop("foo"),
        Lens.prop("bar")
      );

      const answerLens = Lens.compose(
        foobarLens,
        Lens.prop("baz"),
        Lens.index(0),
        Lens.prop("answer")
      );

      const obj2a = foobarLens.update(obj, () => ({ baz: [] }));
      const obj2b = answerLens.update(obj, () => 666);

      expect(obj).toEqual({ foo: undefined });
      expect(foobarLens.get(obj)).toBe(undefined);
      expect(answerLens.get(obj)).toBe(undefined);

      expect(obj2a).toEqual({ foo: { bar: { baz: [] } } });
      expect(foobarLens.get(obj2a)).toEqual({ baz: [] });
      expect(answerLens.get(obj2a)).toBe(undefined);

      expect(obj2b).toEqual({ foo: { bar: { baz: [{ answer: 666 }] } } });
      expect(foobarLens.get(obj2b)).toEqual({ baz: [{ answer: 666 }] });
      expect(answerLens.get(obj2b)).toBe(666);

      assert<
        IsExact<
          ReturnType<typeof foobarLens.get>,
          { baz: Array<{ answer: number }> } | undefined
        >
      >(true);
      assert<IsExact<ReturnType<typeof foobarLens.update>, typeof obj>>(true);

      assert<IsExact<ReturnType<typeof answerLens.get>, number | undefined>>(
        true
      );
      assert<IsExact<ReturnType<typeof answerLens.update>, typeof obj>>(true);
    });

    it("works for just one element", () => {
      const obj = { foo: "A", bar: "B" };

      const atFoo = Lens.compose(Lens.prop<typeof obj, "foo">("foo"));

      const obj2 = atFoo.update(obj, () => "C");

      expect(atFoo.get(obj)).toBe("A");
      expect(atFoo.get(obj2)).toBe("C");

      assert<IsExact<ReturnType<typeof atFoo.get>, typeof obj["foo"]>>(true);
    });
  });
});
