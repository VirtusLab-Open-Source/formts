import { assert, IsExact } from "conditional-type-checks";

import { FormSchema } from "../types/form-schema";
import { impl } from "../types/get-impl";

import { createFormSchema } from "./create-form-schema";

describe("createFormSchema", () => {
  it.skip("creates FormSchema type based on field decoders with default error type", () => {
    const Schema = createFormSchema(fields => ({
      string: fields.string(),
      choice: fields.choice("A", "B", "C"),
      num: fields.number(),
      bool: fields.bool(),
      arrayString: fields.array(fields.string()),
      arrayChoice: fields.array(fields.choice("a", "b", "c")),
      arrayArrayString: fields.array(fields.array(fields.string())),
      instance: fields.instanceOf(Date),
    }));

    type Actual = typeof Schema;
    type Expected = FormSchema<
      {
        string: string;
        choice: "A" | "B" | "C";
        num: number | "";
        bool: boolean;
        arrayString: string[];
        arrayChoice: Array<"a" | "b" | "c">;
        arrayArrayString: string[][];
        instance: Date | null;
      },
      never
    >;

    assert<IsExact<Actual, Expected>>(true);
  });

  it.skip("creates FormSchema type based on field decoders with custom error type", () => {
    const Schema = createFormSchema(
      fields => ({
        string: fields.string(),
        choice: fields.choice("A", "B", "C"),
        num: fields.number(),
        bool: fields.bool(),
        arrayString: fields.array(fields.string()),
        arrayChoice: fields.array(fields.choice("a", "b", "c")),
        arrayArrayString: fields.array(fields.array(fields.string())),
        instance: fields.instanceOf(Date),
      }),
      error => error<"ERR_1" | "ERR_2">()
    );

    type Actual = typeof Schema;
    type Expected = FormSchema<
      {
        string: string;
        choice: "A" | "B" | "C";
        num: number | "";
        bool: boolean;
        arrayString: string[];
        arrayChoice: Array<"a" | "b" | "c">;
        arrayArrayString: string[][];
        instance: Date | null;
      },
      "ERR_1" | "ERR_2"
    >;

    assert<IsExact<Actual, Expected>>(true);
  });

  it.skip("creates empty schema object when no fields are specified", () => {
    const Schema = createFormSchema(() => ({}));

    expect(Object.keys(Schema)).toEqual([]);
  });

  it.skip("creates schema object with keys for every field", () => {
    const Schema = createFormSchema(fields => ({
      string: fields.string(),
      choice: fields.choice("A", "B", "C"),
      num: fields.number(),
      bool: fields.bool(),
      arrayString: fields.array(fields.string()),
      arrayChoice: fields.array(fields.choice("a", "b", "c")),
      arrayArrayString: fields.array(fields.array(fields.string())),
      instance: fields.instanceOf(Date),
    }));

    expect(Object.keys(Schema)).toEqual([
      "string",
      "choice",
      "num",
      "bool",
      "arrayString",
      "arrayChoice",
      "arrayArrayString",
      "instance",
    ]);
  });

  it.skip("creates schema object with paths for every field", () => {
    const Schema = createFormSchema(fields => ({
      string: fields.string(),
      choice: fields.choice("A", "B", "C"),
      num: fields.number(),
      bool: fields.bool(),
      arrayString: fields.array(fields.string()),
      arrayChoice: fields.array(fields.choice("a", "b", "c")),
      arrayArrayString: fields.array(fields.array(fields.string())),
      instance: fields.instanceOf(Date),
    }));

    expect(Schema).toEqual({
      string: expect.objectContaining({ path: "string" }),
      choice: expect.objectContaining({ path: "choice" }),
      num: expect.objectContaining({ path: "num" }),
      bool: expect.objectContaining({ path: "bool" }),
      arrayString: expect.objectContaining({
        root: expect.objectContaining({ path: "arrayString" }),
      }),
      arrayChoice: expect.objectContaining({
        root: expect.objectContaining({ path: "arrayChoice" }),
      }),
      arrayArrayString: expect.objectContaining({
        root: expect.objectContaining({ path: "arrayArrayString" }),
      }),
      instance: expect.objectContaining({ path: "instance" }),
    });
  });

  it.skip("creates field descriptor for string field", () => {
    const Schema = createFormSchema(fields => ({
      theString: fields.string(),
    }));

    const descriptor = impl(Schema.theString);

    expect(descriptor.fieldType).toBe("string");
    expect(descriptor.path).toBe("theString");
    expect(descriptor.init()).toBe("");
    expect(descriptor.decode("foo").ok).toBe(true);
    expect(descriptor.decode(42).ok).toBe(false);
  });

  it.skip("creates field descriptor for choice field", () => {
    const Schema = createFormSchema(fields => ({
      theChoice: fields.choice("A", "B", "C"),
    }));

    const descriptor = impl(Schema.theChoice);

    expect(descriptor.fieldType).toBe("choice");
    expect(descriptor.path).toBe("theChoice");
    expect(descriptor.options).toEqual(["A", "B", "C"]);
    expect(descriptor.init()).toBe("A");
    expect(descriptor.decode("C").ok).toBe(true);
    expect(descriptor.decode("foo").ok).toBe(false);
  });

  it.skip("creates field descriptor for number field", () => {
    const Schema = createFormSchema(fields => ({
      theNumber: fields.number(),
    }));

    const descriptor = impl(Schema.theNumber);

    expect(descriptor.fieldType).toBe("number");
    expect(descriptor.path).toBe("theNumber");
    expect(descriptor.init()).toBe("");
    expect(descriptor.decode(666).ok).toBe(true);
    expect(descriptor.decode("42").ok).toBe(false);
  });

  it.skip("creates field descriptor for bool field", () => {
    const Schema = createFormSchema(fields => ({
      theBoolean: fields.bool(),
    }));

    const descriptor = impl(Schema.theBoolean);

    expect(descriptor.fieldType).toBe("bool");
    expect(descriptor.path).toBe("theBoolean");
    expect(descriptor.init()).toBe(false);
    expect(descriptor.decode(true).ok).toBe(true);
    expect(descriptor.decode("true").ok).toBe(false);
  });

  it.skip("creates field descriptor for array field", () => {
    const Schema = createFormSchema(fields => ({
      theArray: fields.array(fields.string()),
    }));

    const rootDescriptor = impl(Schema.theArray.root);

    expect(rootDescriptor.fieldType).toBe("array");
    expect(rootDescriptor.path).toBe("theArray");
    expect(rootDescriptor.init()).toEqual([]);
    expect(rootDescriptor.decode(["foo", "bar"]).ok).toBe(true);
    expect(rootDescriptor.decode("foo").ok).toBe(false);
    expect(rootDescriptor.inner.fieldType).toBe("string");

    const elementDescriptor = impl(Schema.theArray.nth(42));

    expect(elementDescriptor.fieldType).toBe("string");
    expect(elementDescriptor.path).toBe("theArray.42");
    expect(elementDescriptor.init()).toEqual("");
    expect(elementDescriptor.decode("foo").ok).toBe(true);
    expect(elementDescriptor.decode(["foo", "bar"]).ok).toBe(false);
  });

  it.skip("creates field descriptor for nested array field", () => {
    const Schema = createFormSchema(fields => ({
      theArray: fields.array(fields.array(fields.number())),
    }));

    const rootDescriptor = impl(Schema.theArray.root);
    expect(rootDescriptor.fieldType).toBe("array");
    expect(rootDescriptor.path).toBe("theArray");

    const elementDescriptor = impl(Schema.theArray.nth(42).root);
    expect(elementDescriptor.fieldType).toBe("array");
    expect(elementDescriptor.path).toBe("theArray.42");

    const elementElementDescriptor = impl(Schema.theArray.nth(42).nth(666));
    expect(elementElementDescriptor.fieldType).toBe("number");
    expect(elementElementDescriptor.path).toBe("theArray.42.666");
  });

  it.skip("creates field descriptor for instanceOf field", () => {
    class MyClass {
      constructor(public foo: string) {}
    }

    const Schema = createFormSchema(fields => ({
      theClass: fields.instanceOf(MyClass),
    }));

    const descriptor = impl(Schema.theClass);

    expect(descriptor.fieldType).toBe("class");
    expect(descriptor.path).toBe("theClass");
    expect(descriptor.init()).toBe(null);
    expect(descriptor.decode(new MyClass("42")).ok).toBe(true);
    expect(descriptor.decode({ foo: "42" }).ok).toBe(false);
  });
});
