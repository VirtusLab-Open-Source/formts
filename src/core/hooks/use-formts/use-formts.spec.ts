import { act, renderHook } from "@testing-library/react-hooks";

import { createFormSchema } from "../../builders/create-form-schema";

import { useFormts } from "./use-formts";

describe("useFormts", () => {
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

  it("returns form handle with values initialized to defaults", () => {
    const hook = renderHook(() => useFormts({ Schema }));

    const [, form] = hook.result.current;

    expect(form.values).toEqual({
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

  it("returns form handle with  values initialized to defaults merged with custom initial values", () => {
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

    const [, form] = hook.result.current;

    expect(form.values).toEqual({
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

  it("allows for getting values using corresponding field handles", () => {
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

    const [fields] = hook.result.current;

    expect(fields.theChoice.value).toEqual("C");
    expect(fields.theNum.value).toEqual(42);
    expect(fields.theArray.value).toEqual(["here", "comes", "the", "sun"]);
    expect(fields.theArray.children[42]?.value).toEqual(undefined);
    expect(fields.theObject.value).toEqual({ foo: "bar" });
    expect(fields.theObject.children.foo.value).toEqual("bar");
    expect(fields.theObjectArray.value).toEqual({ arr: [] });
  });

  it("allows for setting values using corresponding field handles and keeps track of touched state", () => {
    const hook = renderHook(() => useFormts({ Schema }));

    {
      const [fields, form] = hook.result.current;
      expect(form.values).toEqual({
        theString: "",
        theChoice: "A",
        theNum: "",
        theBool: false,
        theInstance: null,
        theArray: [],
        theObject: { foo: "" },
        theObjectArray: { arr: [] },
      });
      expect(fields.theString.isTouched).toBe(false);
      expect(fields.theChoice.isTouched).toBe(false);
      expect(fields.theNum.isTouched).toBe(false);
      expect(fields.theBool.isTouched).toBe(false);
      expect(fields.theInstance.isTouched).toBe(false);
      expect(fields.theArray.isTouched).toBe(false);
      expect(fields.theObject.isTouched).toBe(false);
      expect(fields.theObject.children.foo.isTouched).toBe(false);
      expect(fields.theObjectArray.isTouched).toBe(false);
      expect(fields.theObjectArray.children.arr.isTouched).toBe(false);
    }

    act(() => {
      const [fields] = hook.result.current;
      fields.theNum.setValue(42);
    });

    {
      const [fields, form] = hook.result.current;
      expect(fields.theNum.value).toBe(42);
      expect(fields.theNum.isTouched).toBe(true);
      expect(form.values).toEqual({
        theString: "",
        theChoice: "A",
        theNum: 42,
        theBool: false,
        theInstance: null,
        theArray: [],
        theObject: { foo: "" },
        theObjectArray: { arr: [] },
      });
    }

    act(() => {
      const [fields] = hook.result.current;
      fields.theArray.setValue(["gumisie", "teletubisie"]);
    });

    {
      const [fields, form] = hook.result.current;
      expect(fields.theArray.value).toEqual(["gumisie", "teletubisie"]);
      expect(fields.theArray.isTouched).toBe(true);
      expect(fields.theArray.children[0]?.value).toBe("gumisie");
      expect(fields.theArray.children[1]?.value).toBe("teletubisie");
      expect(fields.theArray.children[2]?.value).toBe(undefined);
      expect(fields.theArray.children[0]?.isTouched).toBe(true);
      expect(fields.theArray.children[1]?.isTouched).toBe(true);
      expect(fields.theArray.children[2]?.isTouched).toBe(undefined);
      expect(form.values).toEqual({
        theString: "",
        theChoice: "A",
        theNum: 42,
        theBool: false,
        theInstance: null,
        theArray: ["gumisie", "teletubisie"],
        theObject: { foo: "" },
        theObjectArray: { arr: [] },
      });
    }

    act(() => {
      const [fields] = hook.result.current;
      fields.theObject.children.foo.setValue("42");
    });

    {
      const [fields, form] = hook.result.current;
      expect(fields.theObject.value).toEqual({ foo: "42" });
      expect(fields.theObject.isTouched).toBe(true);
      expect(fields.theObject.children.foo.value).toEqual("42");
      expect(fields.theObject.children.foo.isTouched).toBe(true);
      expect(form.values).toEqual({
        theString: "",
        theChoice: "A",
        theNum: 42,
        theBool: false,
        theInstance: null,
        theArray: ["gumisie", "teletubisie"],
        theObject: { foo: "42" },
        theObjectArray: { arr: [] },
      });
    }
  });

  it("exposes options of choice fields", () => {
    const hook = renderHook(() => useFormts({ Schema }));

    const [fields] = hook.result.current;

    expect(fields.theChoice.options).toEqual({
      A: "A",
      B: "B",
      C: "C",
    });
  });
});
