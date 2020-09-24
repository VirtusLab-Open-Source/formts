import { assert, IsExact } from "conditional-type-checks";

import { choice } from "./choice";

describe("number decoder", () => {
  it("should force the user to provide input options", () => {
    try {
      const invalidDecoder = choice();
      assert<IsExact<typeof invalidDecoder, void>>(true);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
    expect.assertions(1);
  });

  it("should provide it's field type", () => {
    const decoder = choice("A", "B", "C");

    expect(decoder.fieldType).toBe("choice");
  });

  it("should provide initial field value", () => {
    const decoder = choice("A", "B", "C");

    expect(decoder.init()).toBe("A");
  });

  it("should exposed it's options", () => {
    const decoder = choice("", "A", "B", "C");

    expect(decoder.options).toEqual(["", "A", "B", "C"]);
  });

  it("should decode whitelisted values", () => {
    const decoder = choice("A", "B", "C");

    ["A", "B", "C"].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: true, value })
    );
  });

  it("should NOT decode other string values", () => {
    const decoder = choice("A", "B", "C");

    [
      "a",
      "b",
      "c",
      "",
      " ",
      "A ",
      " A",
      " A ",
      "ABC",
      "foobar",
    ].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false, value })
    );
  });

  it("should NOT decode number values", () => {
    const decoder = choice("A", "B", "C");

    [NaN, +Infinity, -Infinity].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false, value })
    );
  });

  it("should NOT decode string values", () => {
    const decoder = choice("A", "B", "C");

    [" ", "foo", " BAR ", "🔥"].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false, value })
    );
  });

  it("should NOT decode boolean values", () => {
    const decoder = choice("A", "B", "C");

    [true, false].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false, value })
    );
  });

  it("should NOT decode objects", () => {
    const decoder = choice("A", "B", "C");

    [{}, { foo: "bar" }, new Error("error"), []].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false, value })
    );
  });

  it("should NOT decode nullable values", () => {
    const decoder = choice("A", "B", "C");

    [null, undefined].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false, value })
    );
  });
});
