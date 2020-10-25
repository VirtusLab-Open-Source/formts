import { FieldErrors } from "../../types/formts-state";

import { resolveIsValid } from "./resolve-is-valid";

describe("resolveIsValid", () => {
  it("handles primitive field errors", () => {
    const errors: FieldErrors<string> = {
      foo: "error!",
      bar: undefined,
    };

    expect(resolveIsValid(errors, "foo")).toBe(false);
    expect(resolveIsValid(errors, "bar")).toBe(true);
    expect(resolveIsValid(errors, "baz")).toBe(true);
  });

  it("handles root array field errors", () => {
    const errors: FieldErrors<string> = {
      array: "error!",
    };

    expect(resolveIsValid(errors, "array")).toBe(false);
    expect(resolveIsValid(errors, "array[42]")).toBe(true);
  });

  it("handles array item field errors", () => {
    const errors: FieldErrors<string> = {
      "array[0]": "error!",
    };

    expect(resolveIsValid(errors, "array")).toBe(false);
    expect(resolveIsValid(errors, "array[0]")).toBe(false);
    expect(resolveIsValid(errors, "array[42]")).toBe(true);
  });

  it("handles root object field errors", () => {
    const errors: FieldErrors<string> = {
      object: "error!",
    };

    expect(resolveIsValid(errors, "object")).toBe(false);
    expect(resolveIsValid(errors, "object.prop")).toBe(true);
  });

  it("handles object property field errors", () => {
    const errors: FieldErrors<string> = {
      "object.prop": "error!",
    };

    expect(resolveIsValid(errors, "object")).toBe(false);
    expect(resolveIsValid(errors, "object.prop")).toBe(false);
    expect(resolveIsValid(errors, "object.otherProp")).toBe(true);
  });

  it("handles nested object and array fields", () => {
    const errors: FieldErrors<string> = {
      "nested.nestedArr[42].foo": "error!",
    };

    expect(resolveIsValid(errors, "nested")).toBe(false);
    expect(resolveIsValid(errors, "nested.nestedArr")).toBe(false);
    expect(resolveIsValid(errors, "nested.nestedArr[42]")).toBe(false);
    expect(resolveIsValid(errors, "nested.nestedArr[42].foo")).toBe(false);

    expect(resolveIsValid(errors, "nested.otherProp")).toBe(true);
    expect(resolveIsValid(errors, "nested.nestedArr[43]")).toBe(true);
    expect(resolveIsValid(errors, "nested.nestedArr[42].otherProp")).toBe(true);
  });
});
