import { FieldDescriptor } from "../../types/field-descriptor";
import { FieldValidatingState } from "../../types/formts-state";
import { opaque } from "../../types/type-mapper-util";

import { resolveIsValidating } from "./resolve-is-validating";

const primitiveDescriptor = (path: string): FieldDescriptor<unknown> =>
  opaque({
    __path: path,
    __decoder: { fieldType: "string" } as any,
  });

const complexDescriptor = (path: string): FieldDescriptor<unknown> =>
  opaque({
    __path: path,
    __decoder: { fieldType: "object" } as any,
  });

describe("resolveIsValidating", () => {
  it("handles primitive fields", () => {
    const state: FieldValidatingState = {
      foo: { aaa: true },
    };

    expect(resolveIsValidating(state, primitiveDescriptor("foo"))).toBe(true);
    expect(resolveIsValidating(state, primitiveDescriptor("bar"))).toBe(false);
    expect(resolveIsValidating(state, primitiveDescriptor("baz"))).toBe(false);
  });

  it("handles root array fields", () => {
    const state: FieldValidatingState = {
      array: { aaa: true },
    };

    expect(resolveIsValidating(state, complexDescriptor("array"))).toBe(true);
    expect(resolveIsValidating(state, primitiveDescriptor("array[42]"))).toBe(
      false
    );
  });

  it("handles array item field", () => {
    const state: FieldValidatingState = {
      "array[0]": { aaa: true },
    };

    expect(resolveIsValidating(state, primitiveDescriptor("array"))).toBe(
      false
    );
    expect(resolveIsValidating(state, complexDescriptor("array"))).toBe(true);
    expect(resolveIsValidating(state, primitiveDescriptor("array[0]"))).toBe(
      true
    );
    expect(resolveIsValidating(state, primitiveDescriptor("array[42]"))).toBe(
      false
    );
  });

  it("handles root object field", () => {
    const state: FieldValidatingState = {
      object: { aaa: true },
    };

    expect(resolveIsValidating(state, complexDescriptor("object"))).toBe(true);
    expect(resolveIsValidating(state, primitiveDescriptor("object.prop"))).toBe(
      false
    );
  });

  it("handles object property field errors", () => {
    const state: FieldValidatingState = {
      "object.prop": { aaa: true },
    };

    expect(resolveIsValidating(state, primitiveDescriptor("object"))).toBe(
      false
    );
    expect(resolveIsValidating(state, complexDescriptor("object"))).toBe(true);
    expect(resolveIsValidating(state, primitiveDescriptor("object.prop"))).toBe(
      true
    );
    expect(
      resolveIsValidating(state, primitiveDescriptor("object.otherProp"))
    ).toBe(false);
  });

  it("handles nested object and array fields", () => {
    const state: FieldValidatingState = {
      "nested.nestedArr[42].foo": { aaa: true },
    };

    expect(resolveIsValidating(state, complexDescriptor("nested"))).toBe(true);

    expect(
      resolveIsValidating(state, complexDescriptor("nested.nestedArr"))
    ).toBe(true);

    expect(
      resolveIsValidating(state, complexDescriptor("nested.nestedArr[42]"))
    ).toBe(true);

    expect(
      resolveIsValidating(
        state,
        primitiveDescriptor("nested.nestedArr[42].foo")
      )
    ).toBe(true);

    expect(
      resolveIsValidating(state, primitiveDescriptor("nested.otherProp"))
    ).toBe(false);

    expect(
      resolveIsValidating(state, complexDescriptor("nested.nestedArr[43]"))
    ).toBe(false);

    expect(
      resolveIsValidating(
        state,
        complexDescriptor("nested.nestedArr[42].otherProp")
      )
    ).toBe(false);
  });
});
