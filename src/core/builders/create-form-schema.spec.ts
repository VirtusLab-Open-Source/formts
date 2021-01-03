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
      date: fields.date(),
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
        date: Date | null;
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
        date: fields.date(),
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
        date: Date | null;
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
      date: fields.date(),
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
      "date",
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
      date: fields.date(),
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

    expect(Schema).toEqual({
      string: expect.objectContaining({ __path: "string" }),
      choice: expect.objectContaining({ __path: "choice" }),
      num: expect.objectContaining({ __path: "num" }),
      bool: expect.objectContaining({ __path: "bool" }),
      date: expect.objectContaining({ __path: "date" }),
      arrayString: expect.objectContaining({
        __path: "arrayString",
        nth: expect.any(Function),
      }),
      arrayChoice: expect.objectContaining({
        __path: "arrayChoice",
        nth: expect.any(Function),
      }),
      arrayArrayString: expect.objectContaining({
        __path: "arrayArrayString",
        nth: expect.any(Function),
      }),
      object: expect.objectContaining({
        __path: "object",
        str: expect.objectContaining({ __path: "object.str" }),
        num: expect.objectContaining({ __path: "object.num" }),
      }),
      arrayObjectString: expect.objectContaining({
        __path: "arrayObjectString",
        nth: expect.any(Function),
      }),
      objectArray: expect.objectContaining({
        __path: "objectArray",
        arrayString: expect.objectContaining({
          __path: "objectArray.arrayString",
          nth: expect.any(Function),
        }),
      }),
      objectObjectArrayObjectString: expect.objectContaining({
        __path: "objectObjectArrayObjectString",
        obj: expect.objectContaining({
          __path: "objectObjectArrayObjectString.obj",
          array: expect.objectContaining({
            __path: "objectObjectArrayObjectString.obj.array",
            nth: expect.any(Function),
          }),
        }),
      }),
    });
  });

  it("creates field descriptor for string field", () => {
    const Schema = createFormSchema(fields => ({
      theString: fields.string(),
    }));

    const descriptor = impl(Schema.theString);

    expect(descriptor.__path).toBe("theString");
    expect(descriptor.__decoder.fieldType).toBe("string");
    expect(descriptor.__decoder.init()).toBe("");
    expect(descriptor.__decoder.decode("foo").ok).toBe(true);
    expect(descriptor.__decoder.decode(42).ok).toBe(false);
  });

  it("creates field descriptor for choice field", () => {
    const Schema = createFormSchema(fields => ({
      theChoice: fields.choice("A", "B", "C"),
    }));

    const descriptor = impl(Schema.theChoice);

    expect(descriptor.__path).toBe("theChoice");
    expect(descriptor.__decoder.fieldType).toBe("choice");
    expect(descriptor.__decoder.options).toEqual(["A", "B", "C"]);
    expect(descriptor.__decoder.init()).toBe("A");
    expect(descriptor.__decoder.decode("C").ok).toBe(true);
    expect(descriptor.__decoder.decode("foo").ok).toBe(false);
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

    expect(descriptor.__path).toBe("theNumber");
    expect(descriptor.__decoder.fieldType).toBe("number");
    expect(descriptor.__decoder.init()).toBe("");
    expect(descriptor.__decoder.decode(666).ok).toBe(true);
    expect(descriptor.__decoder.decode("42").ok).toBe(false);
  });

  it("creates field descriptor for bool field", () => {
    const Schema = createFormSchema(fields => ({
      theBoolean: fields.bool(),
    }));

    const descriptor = impl(Schema.theBoolean);

    expect(descriptor.__path).toBe("theBoolean");
    expect(descriptor.__decoder.fieldType).toBe("bool");
    expect(descriptor.__decoder.init()).toBe(false);
    expect(descriptor.__decoder.decode(true).ok).toBe(true);
    expect(descriptor.__decoder.decode("true").ok).toBe(false);
  });

  it("creates field descriptor for date field", () => {
    const Schema = createFormSchema(fields => ({
      theDate: fields.date(),
    }));

    const descriptor = impl(Schema.theDate);

    expect(descriptor.__path).toBe("theDate");
    expect(descriptor.__decoder.fieldType).toBe("date");
    expect(descriptor.__decoder.init()).toBe(null);
    expect(descriptor.__decoder.decode(new Date()).ok).toBe(true);
    expect(descriptor.__decoder.decode(new Date("foo")).ok).toBe(false);
  });

  it("creates field descriptor for array field", () => {
    const Schema = createFormSchema(fields => ({
      theArray: fields.array(fields.string()),
    }));

    const rootDescriptor = impl(Schema.theArray);

    expect(rootDescriptor.__path).toBe("theArray");
    expect(rootDescriptor.__decoder.fieldType).toBe("array");
    expect(rootDescriptor.__decoder.init()).toEqual([]);
    expect(rootDescriptor.__decoder.decode(["foo", "bar"]).ok).toBe(true);
    expect(rootDescriptor.__decoder.decode("foo").ok).toBe(false);
    expect(rootDescriptor.__decoder.inner.fieldType).toBe("string");

    const elementDescriptor = impl(Schema.theArray.nth(42));

    expect(elementDescriptor.__decoder.fieldType).toBe("string");
    expect(elementDescriptor.__path).toBe("theArray[42]");
    expect(elementDescriptor.__decoder.init()).toEqual("");
    expect(elementDescriptor.__decoder.decode("foo").ok).toBe(true);
    expect(elementDescriptor.__decoder.decode(["foo", "bar"]).ok).toBe(false);
  });

  it("creates field descriptor for nested array field", () => {
    const Schema = createFormSchema(fields => ({
      theArray: fields.array(fields.array(fields.number())),
    }));

    const rootDescriptor = impl(Schema.theArray);
    expect(rootDescriptor.__decoder.fieldType).toBe("array");
    expect(rootDescriptor.__path).toBe("theArray");

    const elementDescriptor = impl(Schema.theArray.nth(42));
    expect(elementDescriptor.__decoder.fieldType).toBe("array");
    expect(elementDescriptor.__path).toBe("theArray[42]");

    const elementElementDescriptor = impl(Schema.theArray.nth(42).nth(666));
    expect(elementElementDescriptor.__decoder.fieldType).toBe("number");
    expect(elementElementDescriptor.__path).toBe("theArray[42][666]");
  });

  it("creates field descriptor for object field", () => {
    const Schema = createFormSchema(fields => ({
      theObject: fields.object({ str: fields.string(), num: fields.number() }),
    }));

    const rootDescriptor = impl(Schema.theObject);
    expect(rootDescriptor.__decoder.fieldType).toBe("object");
    expect(rootDescriptor.__path).toBe("theObject");

    const nestedStringDescriptor = impl(Schema.theObject.str);
    expect(nestedStringDescriptor.__decoder.fieldType).toBe("string");
    expect(nestedStringDescriptor.__path).toBe("theObject.str");

    const nestedNumberDescriptor = impl(Schema.theObject.num);
    expect(nestedNumberDescriptor.__decoder.fieldType).toBe("number");
    expect(nestedNumberDescriptor.__path).toBe("theObject.num");

    expect(Object.keys(Schema.theObject)).toEqual(["str", "num"]);
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

    const rootDescriptor = impl(Schema.theObject);
    expect(rootDescriptor.__decoder.fieldType).toBe("object");
    expect(rootDescriptor.__path).toBe("theObject");

    const nestedChoiceDescriptor = impl(Schema.theObject.choice);
    expect(nestedChoiceDescriptor.__decoder.fieldType).toBe("choice");
    expect(nestedChoiceDescriptor.__path).toBe("theObject.choice");
    expect(nestedChoiceDescriptor.__decoder.options).toEqual(["A", "B"]);

    const nestedObjectDescriptor = impl(Schema.theObject.nested);
    expect(nestedObjectDescriptor.__decoder.fieldType).toBe("object");
    expect(nestedObjectDescriptor.__path).toBe("theObject.nested");

    const nestedNestedArrayDescriptor = impl(Schema.theObject.nested.array);
    expect(nestedNestedArrayDescriptor.__decoder.fieldType).toBe("array");
    expect(nestedNestedArrayDescriptor.__path).toBe("theObject.nested.array");

    const nestedNestedArrayElementRootDescriptor = impl(
      Schema.theObject.nested.array.nth(42)
    );
    expect(nestedNestedArrayElementRootDescriptor.__decoder.fieldType).toBe(
      "object"
    );
    expect(nestedNestedArrayElementRootDescriptor.__path).toBe(
      "theObject.nested.array[42]"
    );

    const nestedNestedArrayElementStringDescriptor = impl(
      Schema.theObject.nested.array.nth(42).str
    );
    expect(nestedNestedArrayElementStringDescriptor.__decoder.fieldType).toBe(
      "string"
    );
    expect(nestedNestedArrayElementStringDescriptor.__path).toBe(
      "theObject.nested.array[42].str"
    );
  });

  it("does not allow creating schema with empty object field", () => {
    createFormSchema(fields => ({
      // @ts-expect-error
      theObject: fields.object({}),
    }));
  });
});
