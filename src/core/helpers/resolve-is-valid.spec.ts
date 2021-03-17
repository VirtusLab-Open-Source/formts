import { Lens } from "../../utils/lenses";
import { FieldDescriptor } from "../types/field-descriptor";
import { FieldErrors } from "../types/formts-state";
import { opaque } from "../types/type-mapper-util";

import { resolveIsValid } from "./resolve-is-valid";

const primitiveDescriptor = (path: string): FieldDescriptor<unknown> =>
  opaque({
    __path: path,
    __decoder: { fieldType: "string" } as any,
    __lens: Lens.prop(path), // not used,
    __parent: undefined as any,
  });

const complexDescriptor = (path: string): FieldDescriptor<unknown> =>
  opaque({
    __path: path,
    __decoder: { fieldType: "object" } as any,
    __lens: Lens.prop(path), // not used,
    __parent: undefined as any,
  });

describe("resolveIsValid", () => {
  it("handles primitive field errors", () => {
    const errors: FieldErrors<string> = {
      foo: "error!",
      bar: undefined,
    };

    expect(resolveIsValid(errors, primitiveDescriptor("foo"))).toBe(false);
    expect(resolveIsValid(errors, primitiveDescriptor("bar"))).toBe(true);
    expect(resolveIsValid(errors, primitiveDescriptor("baz"))).toBe(true);
  });

  it("handles root array field errors", () => {
    const errors: FieldErrors<string> = {
      array: "error!",
    };

    expect(resolveIsValid(errors, complexDescriptor("array"))).toBe(false);
    expect(resolveIsValid(errors, primitiveDescriptor("array[42]"))).toBe(true);
  });

  it("handles array item field errors", () => {
    const errors: FieldErrors<string> = {
      "array[0]": "error!",
    };

    expect(resolveIsValid(errors, primitiveDescriptor("array"))).toBe(true);
    expect(resolveIsValid(errors, complexDescriptor("array"))).toBe(false);
    expect(resolveIsValid(errors, primitiveDescriptor("array[0]"))).toBe(false);
    expect(resolveIsValid(errors, primitiveDescriptor("array[42]"))).toBe(true);
  });

  it("handles root object field errors", () => {
    const errors: FieldErrors<string> = {
      object: "error!",
    };

    expect(resolveIsValid(errors, complexDescriptor("object"))).toBe(false);
    expect(resolveIsValid(errors, primitiveDescriptor("object.prop"))).toBe(
      true
    );
  });

  it("handles object property field errors", () => {
    const errors: FieldErrors<string> = {
      "object.prop": "error!",
    };

    expect(resolveIsValid(errors, primitiveDescriptor("object"))).toBe(true);
    expect(resolveIsValid(errors, complexDescriptor("object"))).toBe(false);
    expect(resolveIsValid(errors, primitiveDescriptor("object.prop"))).toBe(
      false
    );
    expect(
      resolveIsValid(errors, primitiveDescriptor("object.otherProp"))
    ).toBe(true);
  });

  it("handles nested object and array fields", () => {
    const errors: FieldErrors<string> = {
      "nested.nestedArr[42].foo": "error!",
    };

    expect(resolveIsValid(errors, complexDescriptor("nested"))).toBe(false);

    expect(resolveIsValid(errors, complexDescriptor("nested.nestedArr"))).toBe(
      false
    );

    expect(
      resolveIsValid(errors, complexDescriptor("nested.nestedArr[42]"))
    ).toBe(false);

    expect(
      resolveIsValid(errors, primitiveDescriptor("nested.nestedArr[42].foo"))
    ).toBe(false);

    expect(
      resolveIsValid(errors, primitiveDescriptor("nested.otherProp"))
    ).toBe(true);

    expect(
      resolveIsValid(errors, complexDescriptor("nested.nestedArr[43]"))
    ).toBe(true);

    expect(
      resolveIsValid(
        errors,
        complexDescriptor("nested.nestedArr[42].otherProp")
      )
    ).toBe(true);
  });
});
