import { act, renderHook } from "@testing-library/react-hooks";

import { createFormSchema } from "../../builders/create-form-schema";
import { ValidateIn } from "../../types/form-validator";

import { useFormts } from "./use-formts";

describe("useFormts", () => {
  const Schema = createFormSchema(
    fields => ({
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
    }),
    errors => errors<string>()
  );

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

  it("returns form handle with values initialized to defaults merged with custom initial values", () => {
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

  it("allows for setting errors using corresponding field handles and keeps track of isValid state", () => {
    const hook = renderHook(() => useFormts({ Schema }));

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(true);
      expect(form.errors).toEqual([]);

      expect(fields.theString.isValid).toBe(true);
      expect(fields.theString.error).toBe(null);

      expect(fields.theChoice.isValid).toBe(true);
      expect(fields.theChoice.error).toBe(null);

      expect(fields.theNum.isValid).toBe(true);
      expect(fields.theNum.error).toBe(null);

      expect(fields.theBool.isValid).toBe(true);
      expect(fields.theBool.error).toBe(null);

      expect(fields.theInstance.isValid).toBe(true);
      expect(fields.theInstance.error).toBe(null);

      expect(fields.theArray.isValid).toBe(true);
      expect(fields.theArray.error).toBe(null);

      expect(fields.theObject.isValid).toBe(true);
      expect(fields.theObject.error).toBe(null);

      expect(fields.theObject.children.foo.isValid).toBe(true);
      expect(fields.theObject.children.foo.error).toBe(null);

      expect(fields.theObjectArray.isValid).toBe(true);
      expect(fields.theObjectArray.error).toBe(null);

      expect(fields.theObjectArray.children.arr.isValid).toBe(true);
      expect(fields.theObjectArray.children.arr.error).toBe(null);
    }

    act(() => {
      const [fields] = hook.result.current;
      fields.theNum.setError("ERR_1");
    });

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(false);
      expect(form.errors).toEqual([{ path: "theNum", error: "ERR_1" }]);

      expect(fields.theNum.isValid).toBe(false);
      expect(fields.theNum.error).toBe("ERR_1");

      expect(fields.theArray.isValid).toBe(true);
      expect(fields.theArray.error).toBe(null);
    }

    act(() => {
      const [fields] = hook.result.current;
      fields.theArray.setError("ERR_2");
    });

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(false);
      expect(form.errors).toEqual([
        { path: "theNum", error: "ERR_1" },
        { path: "theArray", error: "ERR_2" },
      ]);

      expect(fields.theNum.isValid).toBe(false);
      expect(fields.theNum.error).toBe("ERR_1");

      expect(fields.theArray.isValid).toBe(false);
      expect(fields.theArray.error).toBe("ERR_2");
    }

    act(() => {
      const [fields] = hook.result.current;
      fields.theObject.children.foo.setError("ERR_3");
    });

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(false);
      expect(form.errors).toEqual([
        { path: "theNum", error: "ERR_1" },
        { path: "theArray", error: "ERR_2" },
        { path: "theObject.foo", error: "ERR_3" },
      ]);

      expect(fields.theNum.isValid).toBe(false);
      expect(fields.theNum.error).toBe("ERR_1");
      expect(fields.theArray.isValid).toBe(false);
      expect(fields.theArray.error).toBe("ERR_2");

      expect(fields.theObject.isValid).toBe(false);
      expect(fields.theObject.error).toBe(null);
      expect(fields.theObject.children.foo.isValid).toBe(false);
      expect(fields.theObject.children.foo.error).toBe("ERR_3");
    }
  });

  it("clears errors corresponding to removed array values", () => {
    const hook = renderHook(() => useFormts({ Schema }));

    {
      const [, form] = hook.result.current;
      expect(form.errors).toEqual([]);
    }

    act(() => {
      const [fields] = hook.result.current;
      fields.theArray.setValue(["A", "B", "C"]);
    });

    act(() => {
      const [fields] = hook.result.current;
      fields.theArray.children[0].setError("ERR");
      fields.theArray.children[1].setError("ERR");
      fields.theArray.children[2].setError("ERR");
    });

    {
      const [, form] = hook.result.current;
      expect(form.errors).toEqual([
        { path: "theArray[0]", error: "ERR" },
        { path: "theArray[1]", error: "ERR" },
        { path: "theArray[2]", error: "ERR" },
      ]);
    }

    act(() => {
      const [fields] = hook.result.current;
      fields.theArray.setValue(["AAA"]);
    });

    {
      const [, form] = hook.result.current;
      expect(form.errors).toEqual([{ path: "theArray[0]", error: "ERR" }]);
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

  it("resets form state to initial when form reset method is called", () => {
    const hook = renderHook(() =>
      useFormts({
        Schema,
        initialValues: { theNum: 42 },
      })
    );

    act(() => {
      const [fields] = hook.result.current;
      fields.theNum.setValue(666);
      fields.theNum.setError("ERROR!");
      fields.theObject.children.foo.setValue("bar");
    });

    {
      const [, form] = hook.result.current;
      expect(form.isValid).toBe(false);
      expect(form.isTouched).toBe(true);
      expect(form.values).toEqual({
        theString: "",
        theChoice: "A",
        theNum: 666,
        theBool: false,
        theInstance: null,
        theArray: [],
        theObject: { foo: "bar" },
        theObjectArray: { arr: [] },
      });
    }

    act(() => {
      const [, form] = hook.result.current;
      form.reset();
    });

    {
      const [, form] = hook.result.current;
      expect(form.isValid).toBe(true);
      expect(form.isTouched).toBe(false);
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
  });

  it("validates fields when blur handler is called", async () => {
    const validator = {
      validate: jest
        .fn()
        .mockResolvedValueOnce([{ field: Schema.theNum, error: "ERR_1" }])
        .mockResolvedValueOnce([{ field: Schema.theNum, error: null }]),
    };

    const hook = renderHook(() => useFormts({ Schema, validator }));

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(true);
      expect(form.errors).toEqual([]);

      expect(fields.theNum.isValid).toBe(true);
      expect(fields.theNum.error).toBe(null);

      expect(validator.validate).not.toHaveBeenCalled();
    }

    await act(async () => {
      const [fields] = hook.result.current;
      await fields.theNum.handleBlur();
    });

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(false);
      expect(form.errors).toEqual([{ path: "theNum", error: "ERR_1" }]);

      expect(fields.theNum.isValid).toBe(false);
      expect(fields.theNum.error).toBe("ERR_1");

      expect(validator.validate).toHaveBeenCalledTimes(1);
    }

    await act(async () => {
      const [fields] = hook.result.current;
      await fields.theNum.handleBlur();
    });

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(true);
      expect(form.errors).toEqual([]);

      expect(fields.theNum.isValid).toBe(true);
      expect(fields.theNum.error).toBe(null);

      expect(validator.validate).toHaveBeenCalledTimes(2);
    }
  });

  it("validates fields when validate method is called", async () => {
    const validator = {
      validate: jest
        .fn()
        .mockResolvedValueOnce([{ field: Schema.theNum, error: "ERR_1" }])
        .mockResolvedValueOnce([{ field: Schema.theNum, error: null }]),
    };

    const hook = renderHook(() => useFormts({ Schema, validator }));

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(true);
      expect(form.errors).toEqual([]);

      expect(fields.theNum.isValid).toBe(true);
      expect(fields.theNum.error).toBe(null);

      expect(validator.validate).not.toHaveBeenCalled();
    }

    await act(async () => {
      const [fields] = hook.result.current;
      await fields.theNum.validate();
    });

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(false);
      expect(form.errors).toEqual([{ path: "theNum", error: "ERR_1" }]);

      expect(fields.theNum.isValid).toBe(false);
      expect(fields.theNum.error).toBe("ERR_1");

      expect(validator.validate).toHaveBeenCalledTimes(1);
    }

    await act(async () => {
      const [fields] = hook.result.current;
      await fields.theNum.validate();
    });

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(true);
      expect(form.errors).toEqual([]);

      expect(fields.theNum.isValid).toBe(true);
      expect(fields.theNum.error).toBe(null);

      expect(validator.validate).toHaveBeenCalledTimes(2);
    }
  });

  it("validates fields when field value is changed", async () => {
    const validator = {
      validate: jest
        .fn()
        .mockImplementation(({ fields, getValue }: ValidateIn<any>) =>
          Promise.resolve(
            fields.map(field => ({
              field,
              error: getValue(field) === "" ? "REQUIRED" : null,
            }))
          )
        ),
    };

    const hook = renderHook(() => useFormts({ Schema, validator }));

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(true);
      expect(form.errors).toEqual([]);

      expect(fields.theNum.isValid).toBe(true);
      expect(fields.theNum.error).toBe(null);

      expect(validator.validate).not.toHaveBeenCalled();
    }

    await act(async () => {
      const [fields] = hook.result.current;
      await fields.theNum.setValue(42);
    });

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(true);
      expect(form.errors).toEqual([]);

      expect(fields.theNum.isValid).toBe(true);
      expect(fields.theNum.error).toBe(null);

      expect(validator.validate).toHaveBeenCalledTimes(1);
    }

    await act(async () => {
      const [fields] = hook.result.current;
      await fields.theNum.setValue("");
    });

    {
      const [fields, form] = hook.result.current;
      expect(form.isValid).toBe(false);
      expect(form.errors).toEqual([{ path: "theNum", error: "REQUIRED" }]);

      expect(fields.theNum.isValid).toBe(false);
      expect(fields.theNum.error).toBe("REQUIRED");

      expect(validator.validate).toHaveBeenCalledTimes(2);
    }
  });

  it("validates all fields when form validate method is called", async () => {
    const validator = {
      validate: jest
        .fn()
        .mockImplementation(({ fields }: ValidateIn<any>) =>
          Promise.resolve(fields.map(field => ({ field, error: "ERROR" })))
        ),
    };

    const hook = renderHook(() => useFormts({ Schema, validator }));

    {
      const [, form] = hook.result.current;
      expect(validator.validate).not.toHaveBeenCalled();
      expect(form.isValid).toBe(true);
      expect(form.errors).toEqual([]);
    }

    await act(async () => {
      const [, form] = hook.result.current;
      await form.validate();
    });

    {
      const [, form] = hook.result.current;
      expect(validator.validate).toHaveBeenCalledTimes(1);
      expect(form.isValid).toBe(false);
      expect(form.errors).toEqual([
        { path: "theString", error: "ERROR" },
        { path: "theChoice", error: "ERROR" },
        { path: "theNum", error: "ERROR" },
        { path: "theBool", error: "ERROR" },
        { path: "theInstance", error: "ERROR" },
        { path: "theArray", error: "ERROR" },
        { path: "theObject", error: "ERROR" },
        { path: "theObjectArray", error: "ERROR" },
      ]);
    }
  });

  it("creates submit handler which runs validation of all fields and invokes proper callback", async () => {
    const validator = {
      validate: jest
        .fn()
        .mockImplementationOnce(({ fields }: ValidateIn<any>) =>
          Promise.resolve(fields.map(field => ({ field, error: "ERROR" })))
        )
        .mockResolvedValueOnce([]),
    };

    const hook = renderHook(() => useFormts({ Schema, validator }));
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    const submitHandler = hook.result.current[1].getSubmitHandler(
      onSuccess,
      onFailure
    );

    expect(validator.validate).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();

    await act(async () => {
      await submitHandler();
    });

    expect(validator.validate).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(onFailure).toHaveBeenCalledWith([
      { path: "theString", error: "ERROR" },
      { path: "theChoice", error: "ERROR" },
      { path: "theNum", error: "ERROR" },
      { path: "theBool", error: "ERROR" },
      { path: "theInstance", error: "ERROR" },
      { path: "theArray", error: "ERROR" },
      { path: "theObject", error: "ERROR" },
      { path: "theObjectArray", error: "ERROR" },
    ]);

    await act(async () => {
      await submitHandler();
    });

    expect(validator.validate).toHaveBeenCalledTimes(2);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith({
      theString: "",
      theChoice: "A",
      theNum: "",
      theBool: false,
      theInstance: null,
      theArray: [],
      theObject: { foo: "" },
      theObjectArray: { arr: [] },
    });
    expect(onFailure).toHaveBeenCalledTimes(1);
  });
});
