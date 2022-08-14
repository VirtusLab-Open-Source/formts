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

  it("should decode date strings", () => {
    const decoder = impl(date());

    [
      new Date().toISOString(),
      new Date().toUTCString(),
      new Date().toString(),
    ].forEach(string => {
      return expect(decoder.decode(string)).toEqual({
        ok: true,
        value: new Date(string),
      });
    });
  });

  it("should NOT decode random strings", () => {
    const decoder = impl(date());

    [
      "",
      "foo",
      new Date().toISOString() + "foo",
      "12414252135",
      "May",
    ].forEach(string => expect(decoder.decode(string)).toEqual({ ok: false }));
  });

  it("should decode numbers as timestamp values", () => {
    const decoder = impl(date());

    [0, -10000000, new Date().valueOf()].forEach(number =>
      expect(decoder.decode(number)).toEqual({
        ok: true,
        value: new Date(number),
      })
    );
  });

  it("should NOT decode undefined value", () => {
    const decoder = impl(date());
    const value = undefined;

    expect(decoder.decode(value)).toEqual({ ok: false });
  });
});
