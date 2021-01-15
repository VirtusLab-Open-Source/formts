import { IsExact, assert } from "conditional-type-checks";

import { Lens } from "./lenses";

describe("Lens", () => {
  describe("prop", () => {
    it("allows for accessing properties of an object", () => {
      const obj = { foo: "A", bar: "B" };
      const atFoo = Lens.infer<typeof obj>()(Lens.prop("foo"));

      expect(atFoo.get(obj)).toBe("A");

      assert<IsExact<ReturnType<typeof atFoo.get>, typeof obj["foo"]>>(true);
    });

    it("allows for immutably setting properties of an object", () => {
      const obj = { foo: "A", bar: "B" };
      const atFoo = Lens.infer<typeof obj>()(Lens.prop("foo"));

      const obj2 = atFoo.update(obj, "C");

      expect(obj).toEqual({ foo: "A", bar: "B" });
      expect(obj2).toEqual({ foo: "C", bar: "B" });

      assert<IsExact<ReturnType<typeof atFoo.update>, typeof obj>>(true);
    });
  });

  describe("index", () => {
    it("allows for accessing elements of an array", () => {
      const arr = ["a", "b", "c"];
      const at1 = Lens.infer<typeof arr>()(Lens.index(1));
      const at5 = Lens.infer<typeof arr>()(Lens.index(5));

      expect(at1.get(arr)).toBe("b");
      expect(at5.get(arr)).toBe(undefined);

      assert<IsExact<ReturnType<typeof at1.get>, typeof arr[1] | undefined>>(
        true
      );
    });

    it("allows for immutably setting elements of an array", () => {
      const arr = ["a", "b", "c"];
      const at1 = Lens.infer<typeof arr>()(Lens.index(1));
      const at5 = Lens.infer<typeof arr>()(Lens.index(5));

      const arr2 = at1.update(arr, "B");
      const arr3 = at5.update(arr2, "D");

      expect(arr).toEqual(["a", "b", "c"]);
      expect(arr2).toEqual(["a", "B", "c"]);
      expect(arr3).toEqual(["a", "B", "c", , , "D"]);

      assert<IsExact<ReturnType<typeof at1.update>, typeof arr>>(true);
    });
  });

  describe("chain", () => {
    it("allows for immutably setting and accessing nested object properties", () => {
      const obj = { foo: { bar: 42 }, baz: "C" };

      const atFooBar = Lens.infer<typeof obj>()(
        Lens.chain(Lens.prop("foo"), Lens.prop("bar"))
      );

      const obj2 = atFooBar.update(obj, 666);

      expect(obj).toEqual({ foo: { bar: 42 }, baz: "C" });
      expect(atFooBar.get(obj)).toBe(42);

      expect(obj2).toEqual({ foo: { bar: 666 }, baz: "C" });
      expect(atFooBar.get(obj2)).toBe(666);

      assert<IsExact<ReturnType<typeof atFooBar.get>, number>>(true);
      assert<IsExact<ReturnType<typeof atFooBar.update>, typeof obj>>(true);
    });

    it("allows for immutably setting and accessing deeply nested object properties", () => {
      const obj = { foo: { bar: [1, 2, 3] } };

      const atFooBar1 = Lens.infer<typeof obj>()(
        Lens.chain(Lens.prop("foo"), Lens.prop("bar"), Lens.index(1))
      );

      const obj2 = atFooBar1.update(obj, 666);

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
      const answerLens = Lens.infer<typeof obj>()(
        Lens.chain(
          Lens.prop("foo"),
          Lens.prop("bar"),
          Lens.prop("baz"),
          Lens.index(0),
          Lens.prop("answer")
        )
      );

      const obj2 = answerLens.update(obj, 666);

      expect(obj).toEqual({
        foo: { bar: { baz: [{ answer: 42 }] } },
        other: { a: 1 },
      });
      expect(answerLens.get(obj)).toBe(42);

      expect(obj2).toEqual({
        foo: { bar: { baz: [{ answer: 666 }] } },
        other: { a: 1 },
      });
      expect(answerLens.get(obj2)).toBe(666);

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

      const foobarLens = Lens.infer<O>()(
        Lens.chain(Lens.prop("foo"), Lens.prop("bar"))
      );
      const answerLens = Lens.infer<O>()(
        Lens.chain(
          foobarLens,
          Lens.prop("baz"),
          Lens.index(0),
          Lens.prop("answer")
        )
      );

      const obj2a = foobarLens.update(obj, { baz: [] });
      const obj2b = answerLens.update(obj, 666);

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

      const atFoo = Lens.infer<typeof obj>()(Lens.chain(Lens.prop("foo")));

      const obj2 = atFoo.update(obj, "C");

      expect(atFoo.get(obj)).toBe("A");
      expect(atFoo.get(obj2)).toBe("C");

      assert<IsExact<ReturnType<typeof atFoo.get>, typeof obj["foo"]>>(true);
    });
  });

  describe("of", () => {
    it("allows for immutably setting and accessing very deeply nested optional object properties", () => {
      type O = {
        foo?: { bar: { baz: Array<{ answer: number }> } };
      };
      const obj: O = { foo: undefined };

      const foobarLens = Lens.builder<O>().prop("foo").prop("bar").make();
      const answerLens = Lens.builder<O>()
        .prop("foo")
        .prop("bar")
        .prop("baz")
        .index(0)
        .prop("answer")
        .make();

      const obj2a = foobarLens.update(obj, { baz: [] });
      const obj2ajajaj = foobarLens.update(obj, undefined); // FIXME
      const obj2b = answerLens.update(obj, 666);

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
  });
});
