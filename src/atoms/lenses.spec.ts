import { IsExact, assert } from "conditional-type-checks";

import { Lens } from "./lenses";

describe("Lens", () => {
  describe("prop", () => {
    it("allows for accessing properties of an object", () => {
      const obj = { foo: "A", bar: "B" };
      const atFoo = Lens.forType<typeof obj>()(Lens.prop("foo"));

      expect(atFoo.getter(obj)).toBe("A");

      assert<IsExact<ReturnType<typeof atFoo.getter>, typeof obj["foo"]>>(true);
    });

    it("allows for immutably setting properties of an object", () => {
      const obj = { foo: "A", bar: "B" };
      const atFoo = Lens.forType<typeof obj>()(Lens.prop("foo"));

      const obj2 = atFoo.setter(obj, "C");

      expect(obj).toEqual({ foo: "A", bar: "B" });
      expect(obj2).toEqual({ foo: "C", bar: "B" });

      assert<IsExact<ReturnType<typeof atFoo.setter>, typeof obj>>(true);
    });
  });

  describe("index", () => {
    it("allows for accessing elements of an array", () => {
      const arr = ["a", "b", "c"];
      const at1 = Lens.forType<typeof arr>()(Lens.index(1));
      const at5 = Lens.forType<typeof arr>()(Lens.index(5));

      expect(at1.getter(arr)).toBe("b");
      expect(at5.getter(arr)).toBe(undefined);

      assert<IsExact<ReturnType<typeof at1.getter>, typeof arr[1] | undefined>>(
        true
      );
    });

    it("allows for immutably setting elements of an array", () => {
      const arr = ["a", "b", "c"];
      const at1 = Lens.forType<typeof arr>()(Lens.index(1));
      const at5 = Lens.forType<typeof arr>()(Lens.index(5));

      const arr2 = at1.setter(arr, "B");
      const arr3 = at5.setter(arr2, "D");

      expect(arr).toEqual(["a", "b", "c"]);
      expect(arr2).toEqual(["a", "B", "c"]);
      expect(arr3).toEqual(["a", "B", "c", , , "D"]);

      assert<IsExact<ReturnType<typeof at1.setter>, typeof arr>>(true);
    });
  });

  describe("chain", () => {
    it("allows for immutably setting and accessing nested object properties", () => {
      const obj = { foo: { bar: 42 }, baz: "C" };

      const atFooBar = Lens.forType<typeof obj>()(
        Lens.chain(Lens.prop("foo"), Lens.prop("bar"))
      );

      const obj2 = atFooBar.setter(obj, 666);

      expect(obj).toEqual({ foo: { bar: 42 }, baz: "C" });
      expect(atFooBar.getter(obj)).toBe(42);

      expect(obj2).toEqual({ foo: { bar: 666 }, baz: "C" });
      expect(atFooBar.getter(obj2)).toBe(666);

      assert<IsExact<ReturnType<typeof atFooBar.getter>, number>>(true);
      assert<IsExact<ReturnType<typeof atFooBar.setter>, typeof obj>>(true);
    });

    it("allows for immutably setting and accessing deeply nested object properties", () => {
      const obj = { foo: { bar: [1, 2, 3] } };

      const atFooBar1 = Lens.forType<typeof obj>()(
        Lens.chain(Lens.prop("foo"), Lens.prop("bar"), Lens.index(1))
      );

      const obj2 = atFooBar1.setter(obj, 666);

      expect(obj).toEqual({ foo: { bar: [1, 2, 3] } });
      expect(atFooBar1.getter(obj)).toBe(2);

      expect(obj2).toEqual({ foo: { bar: [1, 666, 3] } });
      expect(atFooBar1.getter(obj2)).toBe(666);

      assert<IsExact<ReturnType<typeof atFooBar1.getter>, number | undefined>>(
        true
      );
      assert<IsExact<ReturnType<typeof atFooBar1.setter>, typeof obj>>(true);
    });

    it("allows for immutably setting and accessing very deeply nested object properties", () => {
      const obj = { foo: { bar: { baz: [{ answer: 42 }] } } };
      const answerLens = Lens.forType<typeof obj>()(
        Lens.chain(
          Lens.prop("foo"),
          Lens.prop("bar"),
          Lens.prop("baz"),
          Lens.index(0),
          Lens.prop("answer")
        )
      );

      const obj2 = answerLens.setter(obj, 666);

      expect(obj).toEqual({ foo: { bar: { baz: [{ answer: 42 }] } } });
      expect(answerLens.getter(obj)).toBe(42);

      expect(obj2).toEqual({ foo: { bar: { baz: [{ answer: 666 }] } } });
      expect(answerLens.getter(obj2)).toBe(666);

      assert<IsExact<ReturnType<typeof answerLens.getter>, number | undefined>>(
        true
      );
      assert<IsExact<ReturnType<typeof answerLens.setter>, typeof obj>>(true);
    });

    it("allows for immutably setting and accessing very deeply nested optional object properties", () => {
      type O = {
        foo?: { bar: { baz: Array<{ answer: number }> } };
      };
      const obj: O = { foo: undefined };

      const foobarLens = Lens.forType<typeof obj>()(
        Lens.chain(Lens.prop("foo"), Lens.prop("bar"))
      );
      const answerLens = Lens.forType<typeof obj>()(
        Lens.chain(
          Lens.prop("foo"),
          Lens.prop("bar"),
          Lens.prop("baz"),
          Lens.index(0),
          Lens.prop("answer")
        )
      );

      const obj2a = foobarLens.setter(obj, { baz: [] });
      const obj2b = answerLens.setter(obj, 666);

      expect(obj).toEqual({ foo: undefined });
      expect(foobarLens.getter(obj)).toBe(undefined);
      expect(answerLens.getter(obj)).toBe(undefined);

      expect(obj2a).toEqual({ foo: { bar: { baz: [] } } });
      expect(foobarLens.getter(obj2a)).toEqual({ baz: [] });
      expect(answerLens.getter(obj2a)).toBe(undefined);

      expect(obj2b).toEqual({ foo: { bar: { baz: [{ answer: 666 }] } } });
      expect(foobarLens.getter(obj2b)).toEqual({ baz: [{ answer: 666 }] });
      expect(answerLens.getter(obj2b)).toBe(666);

      assert<
        IsExact<
          ReturnType<typeof foobarLens.getter>,
          { baz: Array<{ answer: number }> } | undefined
        >
      >(true);
      assert<IsExact<ReturnType<typeof foobarLens.setter>, typeof obj>>(true);

      assert<IsExact<ReturnType<typeof answerLens.getter>, number | undefined>>(
        true
      );
      assert<IsExact<ReturnType<typeof answerLens.setter>, typeof obj>>(true);
    });
  });
});
