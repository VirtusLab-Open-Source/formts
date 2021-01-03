import { impl } from "../types/type-mapper-util";

import { date } from "./date";

describe("date decoder", () => {
  it("should provide it's field type", () => {
    const decoder = impl(date());

    expect(decoder.fieldType).toBe("date");
  });

  it("should provide initial field value", () => {
    const decoder = impl(date());

    expect(decoder.init()).toBe(null);
  });

  it("should decode null value", () => {
    const decoder = impl(date());
    const value = null;

    expect(decoder.decode(value)).toEqual({ ok: true, value });
  });

  it("should decode valid date instance", () => {
    const decoder = impl(date());
    const value = new Date();

    expect(decoder.decode(value)).toEqual({ ok: true, value });
  });

  it("should NOT decode invalid date instance", () => {
    const decoder = impl(date());
    const value = new Date("foobar");

    expect(decoder.decode(value)).toEqual({ ok: false });
  });

  it("should NOT decode date string", () => {
    const decoder = impl(date());
    const value = new Date().toISOString();

    expect(decoder.decode(value)).toEqual({ ok: false });
  });

  it("should NOT decode undefined value", () => {
    const decoder = impl(date());
    const value = undefined;

    expect(decoder.decode(value)).toEqual({ ok: false });
  });
});
