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

  it("should decode matching string values", () => {
    const decoder = impl(bool());

    expect(decoder.decode("true")).toEqual({ ok: true, value: true });
    expect(decoder.decode("True")).toEqual({ ok: true, value: true });
    expect(decoder.decode("TRUE")).toEqual({ ok: true, value: true });
    expect(decoder.decode("true ")).toEqual({ ok: true, value: true });

    expect(decoder.decode("false")).toEqual({ ok: true, value: false });
    expect(decoder.decode("False")).toEqual({ ok: true, value: false });
    expect(decoder.decode("FALSE")).toEqual({ ok: true, value: false });
    expect(decoder.decode("false ")).toEqual({ ok: true, value: false });

    expect(decoder.decode("")).toEqual({ ok: false });
    expect(decoder.decode("1")).toEqual({ ok: false });
    expect(decoder.decode("0")).toEqual({ ok: false });

    expect(decoder.decode("truee")).toEqual({ ok: false });
    expect(decoder.decode("yes")).toEqual({ ok: false });
    expect(decoder.decode("no")).toEqual({ ok: false });
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
