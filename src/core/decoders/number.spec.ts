import { impl } from "../types/type-mapper-util";

import { number } from "./number";

describe("number decoder", () => {
  it("should provide it's field type", () => {
    const decoder = impl(number());

    expect(decoder.fieldType).toBe("number");
  });

  it("should provide initial field value", () => {
    const decoder = impl(number());

    expect(decoder.init()).toBe("");
  });

  it("should decode empty string value", () => {
    const decoder = impl(number());

    ["", "  ", "    "].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: true, value: "" })
    );
  });

  it("should decode finite number values", () => {
    const decoder = impl(number());

    [-100, 0, 666.666, Number.MAX_SAFE_INTEGER, Number.EPSILON].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: true, value })
    );
  });

  it("should NOT decode infinite number values", () => {
    const decoder = impl(number());

    [NaN, +Infinity, -Infinity].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });

  it("should decode string values parsable into numbers", () => {
    const decoder = impl(number());

    ["0", "-42", "0.5", "10000", "10e-2"].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: true, value: Number(value) })
    );
  });

  it("should NOT decode malformed string values", () => {
    const decoder = impl(number());

    ["foo", "🔥", "0,5", "123foo", "10 000"].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });

  it("should NOT decode boolean values", () => {
    const decoder = impl(number());

    [true, false].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });

  it("should NOT decode objects", () => {
    const decoder = impl(number());

    [{}, { foo: "bar" }, new Error("error"), []].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });

  it("should decode valid Date instances", () => {
    const decoder = impl(number());
    const date = new Date();

    expect(decoder.decode(date)).toEqual({ ok: true, value: date.valueOf() });
  });

  it("should NOT decode invalid Date instances", () => {
    const decoder = impl(number());
    const date = new Date("foobar");

    expect(decoder.decode(date)).toEqual({ ok: false });
  });

  it("should NOT decode nullable values", () => {
    const decoder = impl(number());

    [null, undefined].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });
});
