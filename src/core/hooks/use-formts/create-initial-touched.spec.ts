import { createInitialTouched } from "./create-initial-touched";

describe("createInitialTouched", () => {
  it("should be empty for empty values", () => {
    const values = {};

    const touched = createInitialTouched(values);

    expect(touched).toEqual({});
  });

  it("should work for primitive values", () => {
    const values = {
      string: "",
      num: 42,
      choice: "A",
      bool: true,
    };

    const touched = createInitialTouched(values);

    expect(touched).toEqual({
      string: false,
      num: false,
      choice: false,
      bool: false,
    });
  });

  it("should work for object values", () => {
    const values = {
      obj: {
        string: "",
        nestedObj: {
          num: 42,
        },
        emptyObj: {},
      },
    };

    const touched = createInitialTouched(values);

    expect(touched).toEqual({
      obj: {
        string: false,
        nestedObj: {
          num: false,
        },
        emptyObj: {},
      },
    });
  });

  it("should work for instance values", () => {
    const values = {
      empty: null as Date | null,
      instance: new Date() as Date | null,
    };

    const touched = createInitialTouched(values);

    expect(touched).toEqual({
      empty: false,
      instance: false,
    });
  });

  it("should work for array values", () => {
    const values = {
      empty: [],
      filled: ["foo", "bar"],
    };

    const touched = createInitialTouched(values);

    expect(touched).toEqual({
      empty: [],
      filled: [false, false],
    });
  });

  it("should work for nested object and array values values", () => {
    const values = {
      objArr: { arr: ["a", "b", "C"] },
      arrObj: [{ foo: "bar" }],
    };

    const touched = createInitialTouched(values);

    expect(touched).toEqual({
      objArr: { arr: [false, false, false] },
      arrObj: [{ foo: false }],
    });
  });
});
