import { assert, IsExact } from "conditional-type-checks";

import { FormSchema } from "../types/form-schema";
import { impl } from "../types/type-mapper-util";

import { createFormSchema } from "./create-form-schema";

describe("createFormSchema", () => {
  it("creates FormSchema type based on field decoders with default error type", () => {
    const Schema = createFormSchema(fields => ({
      string: fields.string(),
      choice: fields.choice("A", "B", "C"),
      num: fields.number(),
      bool: fields.bool(),
      instance: fields.instanceOf(Date),
      arrayString: fields.array(fields.string()),
      arrayChoice: fields.array(fields.choice("a", "b", "c")),
      arrayArrayString: fields.array(fields.array(fields.string())),
      object: fields.object({ str: fields.string(), num: fields.number() }),
      arrayObjectString: fields.array(fields.object({ str: fields.string() })),
      objectArray: fields.object({
        arrayString: fields.array(fields.string()),
      }),
      objectObjectArrayObjectString: fields.object({
        obj: fields.object({
          array: fields.array(fields.object({ str: fields.string() })),
        }),
      }),
    }));

    type Actual = typeof Schema;
    type Expected = FormSchema<
      {
        string: string;
        choice: "A" | "B" | "C";
        num: number | "";
        bool: boolean;
        instance: Date | null;
        arrayString: string[];
        arrayChoice: Array<"a" | "b" | "c">;
        arrayArrayString: string[][];
        object: { str: string; num: "" | number };
        arrayObjectString: Array<{ str: string }>;
        objectArray: { arrayString: string[] };
        objectObjectArrayObjectString: {
          obj: { array: Array<{ str: string }> };
        };
      },
      never
    >;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("creates FormSchema type based on field decoders with custom error type", () => {
    const Schema = createFormSchema(
      fields => ({
        string: fields.string(),
        choice: fields.choice("A", "B", "C"),
        num: fields.number(),
        bool: fields.bool(),
        instance: fields.instanceOf(Date),
        arrayString: fields.array(fields.string()),
        arrayChoice: fields.array(fields.choice("a", "b", "c")),
        arrayArrayString: fields.array(fields.array(fields.string())),
        object: fields.object({ str: fields.string(), num: fields.number() }),
        arrayObjectString: fields.array(
          fields.object({ str: fields.string() })
        ),
        objectArray: fields.object({
          arrayString: fields.array(fields.string()),
        }),
        objectObjectArrayObjectString: fields.object({
          obj: fields.object({
            array: fields.array(fields.object({ str: fields.string() })),
          }),
        }),
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
        instance: Date | null;
        arrayString: string[];
        arrayChoice: Array<"a" | "b" | "c">;
        arrayArrayString: string[][];
        object: { str: string; num: "" | number };
        arrayObjectString: Array<{ str: string }>;
        objectArray: { arrayString: string[] };
        objectObjectArrayObjectString: {
          obj: { array: Array<{ str: string }> };
        };
      },
      "ERR_1" | "ERR_2"
    >;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("creates empty schema object when no fields are specified", () => {
    const Schema = createFormSchema(() => ({}));

    expect(Object.keys(Schema)).toEqual([]);
  });

  it("creates schema object with keys for every field", () => {
    const Schema = createFormSchema(fields => ({
      string: fields.string(),
      choice: fields.choice("A", "B", "C"),
      num: fields.number(),
      bool: fields.bool(),
      instance: fields.instanceOf(Date),
      arrayString: fields.array(fields.string()),
      arrayChoice: fields.array(fields.choice("a", "b", "c")),
      arrayArrayString: fields.array(fields.array(fields.string())),
      object: fields.object({ str: fields.string(), num: fields.number() }),
      arrayObjectString: fields.array(fields.object({ str: fields.string() })),
      objectArray: fields.object({
        arrayString: fields.array(fields.string()),
      }),
      objectObjectArrayObjectString: fields.object({
        obj: fields.object({
          array: fields.array(fields.object({ str: fields.string() })),
        }),
      }),
    }));

    expect(Object.keys(Schema)).toEqual([
      "string",
      "choice",
      "num",
      "bool",
      "instance",
      "arrayString",
      "arrayChoice",
      "arrayArrayString",
      "object",
      "arrayObjectString",
      "objectArray",
      "objectObjectArrayObjectString",
    ]);
  });

  it("creates schema object with paths for every field", () => {
    const Schema = createFormSchema(fields => ({
      string: fields.string(),
      choice: fields.choice("A", "B", "C"),
      num: fields.number(),
      bool: fields.bool(),
      instance: fields.instanceOf(Date),
      arrayString: fields.array(fields.string()),
      arrayChoice: fields.array(fields.choice("a", "b", "c")),
      arrayArrayString: fields.array(fields.array(fields.string())),
      object: fields.object({ str: fields.string(), num: fields.number() }),
      arrayObjectString: fields.array(fields.object({ str: fields.string() })),
      objectArray: fields.object({
        arrayString: fields.array(fields.string()),
      }),
      objectObjectArrayObjectString: fields.object({
        obj: fields.object({
          array: fields.array(fields.object({ str: fields.string() })),
        }),
      }),
    }));

    const expectPath = (path: string) => expect.objectContaining({ path });

    expect(Schema).toEqual({
      string: expectPath("string"),
      choice: expectPath("choice"),
      num: expectPath("num"),
      bool: expectPath("bool"),
      instance: expectPath("instance"),
      arrayString: {
        root: expectPath("arrayString"),
        nth: expect.any(Function),
      },
      arrayChoice: {
        root: expectPath("arrayChoice"),
        nth: expect.any(Function),
      },
      arrayArrayString: {
        root: expectPath("arrayArrayString"),
        nth: expect.any(Function),
      },
      object: {
        root: expectPath("object"),
        str: expectPath("object.str"),
        num: expectPath("object.num"),
      },
      arrayObjectString: {
        root: expectPath("arrayObjectString"),
        nth: expect.any(Function),
      },
      objectArray: {
        root: expectPath("objectArray"),
        arrayString: {
          root: expectPath("objectArray.arrayString"),
          nth: expect.any(Function),
        },
      },
      objectObjectArrayObjectString: {
        root: expectPath("objectObjectArrayObjectString"),
        obj: {
          root: expectPath("objectObjectArrayObjectString.obj"),
          array: {
            root: expectPath("objectObjectArrayObjectString.obj.array"),
            nth: expect.any(Function),
          },
        },
      },
    });
  });

  it("creates field descriptor for string field", () => {
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

  it("creates field descriptor for choice field", () => {
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

  it("does not allow creating schema with empty choice field", () => {
    createFormSchema(fields => ({
      // @ts-expect-error
      theChoice: fields.choice(),
    }));
  });

  it("creates field descriptor for number field", () => {
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

  it("creates field descriptor for bool field", () => {
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

  it("creates field descriptor for instanceOf field", () => {
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

  it("creates field descriptor for array field", () => {
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
    expect(elementDescriptor.path).toBe("theArray[42]");
    expect(elementDescriptor.init()).toEqual("");
    expect(elementDescriptor.decode("foo").ok).toBe(true);
    expect(elementDescriptor.decode(["foo", "bar"]).ok).toBe(false);
  });

  it("creates field descriptor for nested array field", () => {
    const Schema = createFormSchema(fields => ({
      theArray: fields.array(fields.array(fields.number())),
    }));

    const rootDescriptor = impl(Schema.theArray.root);
    expect(rootDescriptor.fieldType).toBe("array");
    expect(rootDescriptor.path).toBe("theArray");

    const elementDescriptor = impl(Schema.theArray.nth(42).root);
    expect(elementDescriptor.fieldType).toBe("array");
    expect(elementDescriptor.path).toBe("theArray[42]");

    const elementElementDescriptor = impl(Schema.theArray.nth(42).nth(666));
    expect(elementElementDescriptor.fieldType).toBe("number");
    expect(elementElementDescriptor.path).toBe("theArray[42][666]");
  });

  it("creates field descriptor for object field", () => {
    const Schema = createFormSchema(fields => ({
      theObject: fields.object({ str: fields.string(), num: fields.number() }),
    }));

    const rootDescriptor = impl(Schema.theObject.root);
    expect(rootDescriptor.fieldType).toBe("object");
    expect(rootDescriptor.path).toBe("theObject");

    const nestedStringDescriptor = impl(Schema.theObject.str);
    expect(nestedStringDescriptor.fieldType).toBe("string");
    expect(nestedStringDescriptor.path).toBe("theObject.str");

    const nestedNumberDescriptor = impl(Schema.theObject.num);
    expect(nestedNumberDescriptor.fieldType).toBe("number");
    expect(nestedNumberDescriptor.path).toBe("theObject.num");
  });

  it("creates field descriptor for a complex object field", () => {
    const Schema = createFormSchema(fields => ({
      theObject: fields.object({
        choice: fields.choice("A", "B"),
        nested: fields.object({
          array: fields.array(fields.object({ str: fields.string() })),
        }),
      }),
    }));

    const rootDescriptor = impl(Schema.theObject.root);
    expect(rootDescriptor.fieldType).toBe("object");
    expect(rootDescriptor.path).toBe("theObject");

    const nestedChoiceDescriptor = impl(Schema.theObject.choice);
    expect(nestedChoiceDescriptor.fieldType).toBe("choice");
    expect(nestedChoiceDescriptor.path).toBe("theObject.choice");
    expect(nestedChoiceDescriptor.options).toEqual(["A", "B"]);

    const nestedObjectDescriptor = impl(Schema.theObject.nested.root);
    expect(nestedObjectDescriptor.fieldType).toBe("object");
    expect(nestedObjectDescriptor.path).toBe("theObject.nested");

    const nestedNestedArrayDescriptor = impl(
      Schema.theObject.nested.array.root
    );
    expect(nestedNestedArrayDescriptor.fieldType).toBe("array");
    expect(nestedNestedArrayDescriptor.path).toBe("theObject.nested.array");

    const nestedNestedArrayElementRootDescriptor = impl(
      Schema.theObject.nested.array.nth(42).root
    );
    expect(nestedNestedArrayElementRootDescriptor.fieldType).toBe("object");
    expect(nestedNestedArrayElementRootDescriptor.path).toBe(
      "theObject.nested.array[42]"
    );

    const nestedNestedArrayElementStringDescriptor = impl(
      Schema.theObject.nested.array.nth(42).str
    );
    expect(nestedNestedArrayElementStringDescriptor.fieldType).toBe("string");
    expect(nestedNestedArrayElementStringDescriptor.path).toBe(
      "theObject.nested.array[42].str"
    );
  });

  it("does not allow creating schema with empty object field", () => {
    createFormSchema(fields => ({
      // @ts-expect-error
      theObject: fields.object({}),
    }));
  });

  it("does not allow creating schema with nested 'root' field", () => {
    createFormSchema(fields => ({
      // @ts-expect-error
      theObject: fields.object({ foo: fields.string(), root: fields.string() }),
    }));
  });
});
