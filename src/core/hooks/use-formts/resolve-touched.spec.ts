import { resolveTouched } from "./resolve-touched";

describe("resolveTouched", () => {
  it("handles primitive fields", () => {
    expect(resolveTouched(true)).toBe(true);

    expect(resolveTouched(false)).toBe(false);
  });

  it("handles array fields", () => {
    expect(resolveTouched([false, true, false])).toBe(true);

    expect(resolveTouched([false, false, false])).toBe(false);
  });

  it("handles object fields", () => {
    expect(
      resolveTouched({
        a: false,
        b: true,
        c: false,
      })
    ).toBe(true);

    expect(
      resolveTouched({
        a: false,
        b: false,
        c: false,
      })
    ).toBe(false);
  });

  it("handles nested object and array fields", () => {
    expect(
      resolveTouched({
        bool: false,
        arr: [false, false, false],
        nested: {
          nestedArr: [
            [false, false],
            [false, true],
          ],
        },
      })
    ).toBe(true);

    expect(
      resolveTouched({
        bool: false,
        arr: [false, false, false],
        nested: {
          nestedArr: [
            [false, false],
            [false, false],
          ],
        },
      })
    ).toBe(false);
  });
});
