import { impl } from "../types/type-mapper-util";

import { choice } from "./choice";

describe("number decoder", () => {
  it("should force the user to provide input options", () => {
    // @ts-expect-error
    const invalidDecoder = choice();
  });

  it("should provide it's field type", () => {
    const decoder = impl(choice("A", "B", "C"));

    expect(decoder.fieldType).toBe("choice");
  });

  it("should provide initial field value", () => {
    const decoder = impl(choice("A", "B", "C"));

    expect(decoder.init()).toBe("A");
  });

  it("should expose it's options", () => {
    const decoder = impl(choice("", "A", "B", "C"));

    expect(decoder.options).toEqual(["", "A", "B", "C"]);
  });

  it("should decode whitelisted values", () => {
    const decoder = impl(choice("", "A", "B", "C"));

    ["", "A", "B", "C"].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: true, value })
    );
  });

  it("should NOT decode other string values", () => {
    const decoder = impl(choice("A", "B", "C"));

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
    ].forEach(value => expect(decoder.decode(value)).toEqual({ ok: false }));
  });

  it("should decode matching number values", () => {
    const decoder = impl(choice("0", "1"));

    expect(decoder.decode(0)).toEqual({ ok: true, value: "0" });
    expect(decoder.decode(1)).toEqual({ ok: true, value: "1" });
    expect(decoder.decode(2)).toEqual({ ok: false });
    expect(decoder.decode(NaN)).toEqual({ ok: false });
  });

  it("should NOT decode boolean values", () => {
    const decoder = impl(choice("true", "false", "foo"));

    [true, false].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });

  it("should NOT decode objects", () => {
    const decoder = impl(choice("A", "B", "C"));

    [{}, { foo: "bar" }, new Error("error"), []].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });

  it("should NOT decode nullable values", () => {
    const decoder = impl(choice("A", "B", "C"));

    [null, undefined].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });
});
