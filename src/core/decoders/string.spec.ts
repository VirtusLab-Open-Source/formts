import { impl } from "../types/type-mapper-util";

import { string } from "./string";

describe("string decoder", () => {
  it("should provide it's field type", () => {
    const decoder = impl(string());

    expect(decoder.fieldType).toBe("string");
  });

  it("should provide initial field value", () => {
    const decoder = impl(string());

    expect(decoder.init()).toBe("");
  });

  it("should decode string values", () => {
    const decoder = impl(string());

    ["", " ", "foo", " BAR ", "🔥"].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: true, value })
    );
  });

  it("should decode valid Date instance values", () => {
    const decoder = impl(string());
    const date = new Date();

    expect(decoder.decode(date)).toEqual({
      ok: true,
      value: date.toISOString(),
    });
  });

  it("should NOT decode invalid Date instance values", () => {
    const decoder = impl(string());
    const date = new Date("foobar");

    expect(decoder.decode(date)).toEqual({ ok: false });
  });

  it("should decode finite number values", () => {
    const decoder = impl(string());

    [-100, 0, 666.666, Number.MAX_SAFE_INTEGER, Number.EPSILON].forEach(value =>
      expect(decoder.decode(value)).toEqual({
        ok: true,
        value: value.toString(),
      })
    );
  });

  it("should NOT decode infinite number values", () => {
    const decoder = impl(string());

    [NaN, +Infinity, -Infinity].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });

  it("should decode boolean values", () => {
    const decoder = impl(string());

    expect(decoder.decode(true)).toEqual({ ok: true, value: "true" });
    expect(decoder.decode(false)).toEqual({ ok: true, value: "false" });
  });

  it("should NOT decode objects", () => {
    const decoder = impl(string());

    [{}, { foo: "bar" }, new Error("error"), []].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });

  it("should NOT decode nullable values", () => {
    const decoder = impl(string());

    [null, undefined].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });
});
