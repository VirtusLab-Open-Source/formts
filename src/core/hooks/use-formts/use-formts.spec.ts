import { act, renderHook } from "@testing-library/react-hooks";

import { createFormSchema } from "../../builders/create-form-schema";

import { useFormts } from "./use-formts";

describe("use-formts", () => {
  const Schema = createFormSchema(fields => ({
    theString: fields.string(),
    theChoice: fields.choice("A", "B", "C"),
    theNum: fields.number(),
    theBool: fields.bool(),
    theInstance: fields.instanceOf(Date),
    theArray: fields.array(fields.string()),
    theObject: fields.object({
      foo: fields.string(),
    }),
    theObjectArray: fields.object({ arr: fields.array(fields.string()) }),
  }));

  it("returns values initialized to defaults", () => {
    const hook = renderHook(() => useFormts({ Schema }));

    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "A",
      theNum: "",
      theBool: false,
      theInstance: null,
      theArray: [],
      theObject: { foo: "" },
      theObjectArray: { arr: [] },
    });
  });

  it("returns values initialized to defaults merged with custom initial values", () => {
    const hook = renderHook(() =>
      useFormts({
        Schema,
        initialValues: {
          theChoice: "C",
          theNum: 42,
          theArray: ["here", "comes", "the", "sun"],
          theObject: { foo: "bar" },
        },
      })
    );

    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "C",
      theNum: 42,
      theBool: false,
      theInstance: null,
      theArray: ["here", "comes", "the", "sun"],
      theObject: { foo: "bar" },
      theObjectArray: { arr: [] },
    });
  });

  it("allows for getting values by corresponding FieldDescriptor", () => {
    const hook = renderHook(() =>
      useFormts({
        Schema,
        initialValues: {
          theChoice: "C",
          theNum: 42,
          theArray: ["here", "comes", "the", "sun"],
          theObject: { foo: "bar" },
        },
      })
    );

    const { getField } = hook.result.current;
    expect(getField(Schema.theChoice)).toEqual("C");
    expect(getField(Schema.theNum)).toEqual(42);
    expect(getField(Schema.theArray.root)).toEqual([
      "here",
      "comes",
      "the",
      "sun",
    ]);
    expect(getField(Schema.theArray.nth(42))).toEqual(undefined);
    expect(getField(Schema.theObject.root)).toEqual({ foo: "bar" });
    expect(getField(Schema.theObject.foo)).toEqual("bar");
    expect(getField(Schema.theObjectArray.root)).toEqual({ arr: [] });
  });

  it("allows for setting values by corresponding FieldDescriptor", () => {
    const hook = renderHook(() => useFormts({ Schema }));

    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "A",
      theNum: "",
      theBool: false,
      theInstance: null,
      theArray: [],
      theObject: { foo: "" },
      theObjectArray: { arr: [] },
    });

    act(() => {
      hook.result.current.setField(Schema.theNum, 42);
    });
    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "A",
      theNum: 42,
      theBool: false,
      theInstance: null,
      theArray: [],
      theObject: { foo: "" },
      theObjectArray: { arr: [] },
    });

    act(() => {
      hook.result.current.setField(Schema.theArray.root, [
        "gumisie",
        "teletubisie",
      ]);
    });
    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "A",
      theNum: 42,
      theBool: false,
      theInstance: null,
      theArray: ["gumisie", "teletubisie"],
      theObject: { foo: "" },
      theObjectArray: { arr: [] },
    });

    act(() => {
      hook.result.current.setField(Schema.theObject.foo, "42");
    });
    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "A",
      theNum: 42,
      theBool: false,
      theInstance: null,
      theArray: ["gumisie", "teletubisie"],
      theObject: { foo: "42" },
      theObjectArray: { arr: [] },
    });

    act(() => {
      hook.result.current.setField(Schema.theObjectArray.arr.nth(0), "hello");
    });
    expect(hook.result.current.values).toEqual({
      theString: "",
      theChoice: "A",
      theNum: 42,
      theBool: false,
      theInstance: null,
      theArray: ["gumisie", "teletubisie"],
      theObject: { foo: "42" },
      theObjectArray: { arr: ["hello"] },
    });
  });

  it("keeps track of fields touched state", () => {
    const hook = renderHook(() => useFormts({ Schema }));

    {
      const { isTouched } = hook.result.current;
      expect(isTouched(Schema.theString)).toBe(false);
      expect(isTouched(Schema.theChoice)).toBe(false);
      expect(isTouched(Schema.theNum)).toBe(false);
      expect(isTouched(Schema.theBool)).toBe(false);
      expect(isTouched(Schema.theInstance)).toBe(false);
      expect(isTouched(Schema.theArray.root)).toBe(false);
      expect(isTouched(Schema.theObject.root)).toBe(false);
      expect(isTouched(Schema.theObject.foo)).toBe(false);
      expect(isTouched(Schema.theObjectArray.root)).toBe(false);
      expect(isTouched(Schema.theObjectArray.arr.root)).toBe(false);
    }

    {
      act(() => {
        hook.result.current.setField(Schema.theNum, 42);
      });
      expect(hook.result.current.isTouched(Schema.theNum)).toBe(true);
    }

    {
      act(() => {
        hook.result.current.setField(Schema.theArray.root, [
          "gumisie",
          "teletubisie",
        ]);
      });
      const { isTouched } = hook.result.current;

      expect(isTouched(Schema.theArray.root)).toBe(true);
      expect(isTouched(Schema.theArray.nth(0))).toBe(true);
      expect(isTouched(Schema.theArray.nth(1))).toBe(true);
      expect(isTouched(Schema.theArray.nth(2))).toBe(false);
    }

    {
      act(() => {
        hook.result.current.setField(Schema.theObject.foo, "42");
      });
      const { isTouched } = hook.result.current;

      expect(isTouched(Schema.theObject.foo)).toBe(true);
      expect(isTouched(Schema.theObject.root)).toBe(true);
    }

    {
      act(() => {
        hook.result.current.setField(Schema.theObjectArray.root, {
          arr: ["a", "b", "c"],
        });
      });
      const { isTouched } = hook.result.current;

      expect(isTouched(Schema.theObjectArray.root)).toBe(true);
      expect(isTouched(Schema.theObjectArray.arr.root)).toBe(true);
      expect(isTouched(Schema.theObjectArray.arr.nth(0))).toBe(true);
      expect(isTouched(Schema.theObjectArray.arr.nth(1))).toBe(true);
      expect(isTouched(Schema.theObjectArray.arr.nth(2))).toBe(true);
    }
  });

  describe("fields work properly", () => {
    const hook = renderHook(() => useFormts({ Schema }));

    {
      const { fields } = hook.result.current;
      expect(fields.theString.value).toEqual("");
      expect(fields.theChoice.value).toEqual("A");
      expect(fields.theNum.value).toEqual("");
      expect(fields.theBool.value).toBe(false);
      expect(fields.theInstance.value).toEqual(null);
      expect(fields.theArray.value).toEqual([]);
      expect(fields.theObject.value).toEqual({ foo: "" });
      expect(fields.theObject.children.foo.value).toEqual("");
      expect(fields.theObjectArray.value).toEqual({ arr: [] });
      expect(fields.theObjectArray.children.arr.value).toEqual([]);
    }

    {
      act(() => {
        hook.result.current.fields.theNum.setValue(42);
      });
      expect(hook.result.current.fields.theNum.value).toEqual(42);
      expect(hook.result.current.fields.theNum.isTouched).toBe(true);
    }

    {
      act(() => {
        hook.result.current.fields.theArray.setValue([
          "gumisie",
          "teletubisie",
        ]);
      });

      expect(hook.result.current.fields.theArray.value).toEqual([
        "gumisie",
        "teletubisie",
      ]);
      expect(hook.result.current.fields.theArray.children[0].value).toEqual(
        "gumisie"
      );
      expect(hook.result.current.fields.theArray.children[1].value).toEqual(
        "teletubisie"
      );
    }

    {
      act(() => {
        hook.result.current.fields.theObject.children.foo.setValue("42");
      });

      expect(hook.result.current.fields.theObject.value).toEqual({ foo: "42" });
      expect(hook.result.current.fields.theObject.children.foo.value).toEqual(
        "42"
      );
    }

    {
      act(() => {
        hook.result.current.fields.theObjectArray.setValue({
          arr: ["a", "b", "c"],
        });
      });
      expect(hook.result.current.fields.theObjectArray.value).toEqual({
        arr: ["a", "b", "c"],
      });
      expect(
        hook.result.current.fields.theObjectArray.children.arr.value
      ).toEqual(["a", "b", "c"]);
    }
  });
});
