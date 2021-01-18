import { makeTouchedValues, makeUntouchedValues } from "./make-touched-values";

describe("makeTouchedValues", () => {
  it("should be empty for empty values", () => {
    const values = {};

    const touched = makeTouchedValues(values);

    expect(touched).toEqual({});
  });

  it("should work for primitive values", () => {
    const values = {
      string: "",
      num: 42,
      choice: "A",
      bool: true,
    };

    const touched = makeTouchedValues(values);

    expect(touched).toEqual({
      string: true,
      num: true,
      choice: true,
      bool: true,
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

    const touched = makeTouchedValues(values);

    expect(touched).toEqual({
      obj: {
        string: true,
        nestedObj: {
          num: true,
        },
        emptyObj: {},
      },
    });
  });

  it("should work for date values", () => {
    const values = {
      empty: null as Date | null,
      instance: new Date() as Date | null,
    };

    const touched = makeTouchedValues(values);

    expect(touched).toEqual({
      empty: true,
      instance: true,
    });
  });

  it("should work for array values", () => {
    const values = {
      empty: [],
      filled: ["foo", "bar"],
    };

    const touched = makeTouchedValues(values);

    expect(touched).toEqual({
      empty: true,
      filled: [true, true],
    });
  });

  it("should work for nested object and array values values", () => {
    const values = {
      objArr: { arr: ["a", "b", "C"] },
      arrObj: [{ foo: "bar" }],
    };

    const touched = makeTouchedValues(values);

    expect(touched).toEqual({
      objArr: { arr: [true, true, true] },
      arrObj: [{ foo: true }],
    });
  });
});

describe("makeUntouchedValues", () => {
  it("should be empty for empty values", () => {
    const values = {};

    const touched = makeUntouchedValues(values);

    expect(touched).toEqual({});
  });

  it("should work for primitive values", () => {
    const values = {
      string: "",
      num: 42,
      choice: "A",
      bool: true,
    };

    const touched = makeUntouchedValues(values);

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

    const touched = makeUntouchedValues(values);

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

  it("should work for date values", () => {
    const values = {
      empty: null as Date | null,
      instance: new Date() as Date | null,
    };

    const touched = makeUntouchedValues(values);

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

    const touched = makeUntouchedValues(values);

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

    const touched = makeUntouchedValues(values);

    expect(touched).toEqual({
      objArr: { arr: [false, false, false] },
      arrObj: [{ foo: false }],
    });
  });
});
