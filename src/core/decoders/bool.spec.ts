import { impl } from "../types/type-mapper-util";

import { bool } from "./bool";

describe("bool decoder", () => {
  it("should provide it's field type", () => {
    const decoder = impl(bool());

    expect(decoder.fieldType).toBe("bool");
  });

  it("should provide initial field value", () => {
    const decoder = impl(bool());

    expect(decoder.init()).toBe(false);
  });

  it("should decode boolean values", () => {
    const decoder = impl(bool());

    expect(decoder.decode(true)).toEqual({ ok: true, value: true });
    expect(decoder.decode(false)).toEqual({ ok: true, value: false });
  });

  it("should NOT decode string values", () => {
    const decoder = impl(bool());

    [
      "",
      " ",
      "1",
      "0",
      "true",
      "false",
      "TRUE",
      "FALSE",
      "Yes",
      "No",
      "foo",
    ].forEach(value => expect(decoder.decode(value)).toEqual({ ok: false }));
  });

  it("should NOT decode numbers", () => {
    const decoder = impl(bool());

    [0, 666, NaN, +Infinity, -Infinity].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });

  it("should NOT decode objects", () => {
    const decoder = impl(bool());

    [{}, { foo: "bar" }, new Error("error"), []].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });

  it("should NOT decode nullable values", () => {
    const decoder = impl(bool());

    [null, undefined].forEach(value =>
      expect(decoder.decode(value)).toEqual({ ok: false })
    );
  });
});
