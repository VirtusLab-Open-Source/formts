import { string } from "./string";

describe("string decoder", () => {
  it("should provide it's field type", () => {
    const decoder = string();

    expect(decoder.fieldType).toBe("string");
  });

  it("should provide initial field value", () => {
    const decoder = string();

    expect(decoder.init()).toBe("");
  });

  it("should decode string values", () => {
    const decoder = string();

    ["", " ", "foo", " BAR ", "🔥"].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: true, value })
    );
  });

  it("should NOT decode boolean values", () => {
    const decoder = string();

    [true, false].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false, value })
    );
  });

  it("should NOT decode number values", () => {
    const decoder = string();

    [-100, 0, 666.666, NaN, +Infinity, -Infinity].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false, value })
    );
  });

  it("should NOT decode objects", () => {
    const decoder = string();

    [{}, { foo: "bar" }, new Error("error"), []].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false, value })
    );
  });

  it("should NOT decode nullable values", () => {
    const decoder = string();

    [null, undefined].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false, value })
    );
  });
});
