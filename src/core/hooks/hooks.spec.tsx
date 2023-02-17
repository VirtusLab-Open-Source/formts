import { act, renderHook } from "@testing-library/react-hooks";
import React from "react";

import { Task } from "../../utils/task";
import { FormFields, FormSchemaBuilder } from "../builders";
import { FormProvider } from "../context";
import { FormHandle } from "../types/form-handle";
import { ValidateIn } from "../types/form-validator";
import { impl, opaque } from "../types/type-mapper-util";

import { useField } from "./use-field";
import { useFormHandle } from "./use-form-handle";

import { useFormController, useFormValues } from ".";

const Schema = new FormSchemaBuilder()
  .fields({
    theString: FormFields.string(),
    theChoice: FormFields.choice("", "A", "B", "C"),
    theNum: FormFields.number(),
    theBool: FormFields.bool(),
    theDate: FormFields.date(),
    theArray: FormFields.array(FormFields.string()),
    theObject: FormFields.object({
      foo: FormFields.string(),
    }),
    theObjectArray: FormFields.object({
      arr: FormFields.array(FormFields.string()),
    }),
  })
  .errors<string>()
  .build();

describe("formts hooks API", () => {
  it("throws error when a hook is not connected to FormController", () => {
    const { result: formHandleHook } = renderHook(() => useFormHandle(Schema));

    expect(formHandleHook.error != null).toBe(true);
    expect(formHandleHook.error.message).toBe("FormController not found!");
  });

  it("allows for hook usage in root component when passing FormController object directly", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema })
    );

    {
      const { result: formHandleHook } = renderHook(() =>
        useFormHandle(Schema, controllerHook.current)
      );

      expect(formHandleHook.current).toMatchObject({
        isTouched: false,
        isValid: true,
        isValidating: false,
        isSubmitting: false,
        reset: expect.any(Function),
        validate: expect.any(Function),
        submit: expect.any(Function),
        setFieldValue: expect.any(Function),
        setFieldError: expect.any(Function),
      });
    }

    {
      const { result: formValuesHook } = renderHook(() =>
        useFormValues(Schema, controllerHook.current)
      );

      expect(formValuesHook.current).toEqual({
        theString: "",
        theChoice: "",
        theNum: "",
        theBool: false,
        theDate: null,
        theArray: [],
        theObject: { foo: "" },
        theObjectArray: { arr: [] },
      });
    }

    {
      const { result: stringFieldHook } = renderHook(() =>
        useField(Schema.theObject, controllerHook.current)
      );

      expect(stringFieldHook.current).toMatchObject({
        id: "theObject",
        value: { foo: "" },
        error: null,
        isTouched: false,
        isValid: true,
        isValidating: false,
        descriptor: Schema.theObject,
        setValue: expect.any(Function),
        setError: expect.any(Function),
        validate: expect.any(Function),
        handleBlur: expect.any(Function),
        children: {
          foo: {
            id: "theObject.foo",
            value: "",
            error: null,
            isTouched: false,
            isValid: true,
            isValidating: false,
            descriptor: Schema.theObject.foo,
            setValue: expect.any(Function),
            setError: expect.any(Function),
            validate: expect.any(Function),
            handleBlur: expect.any(Function),
          },
        },
      });
    }
  });

  it("allows for hook usage in nested components when passing FormController via FormProvider", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema })
    );

    const wrapper: React.FC = ({ children }) => (
      <FormProvider controller={controllerHook.current}>
        {children}
      </FormProvider>
    );

    {
      const { result: formHandleHook } = renderHook(
        () => useFormHandle(Schema),
        { wrapper }
      );

      expect(formHandleHook.current).toMatchObject({
        isTouched: false,
        isValid: true,
        isValidating: false,
        isSubmitting: false,
        reset: expect.any(Function),
        validate: expect.any(Function),
        submit: expect.any(Function),
        setFieldValue: expect.any(Function),
        setFieldError: expect.any(Function),
      });
    }

    {
      const { result: formValuesHook } = renderHook(
        () => useFormValues(Schema),
        { wrapper }
      );

      expect(formValuesHook.current).toEqual({
        theString: "",
        theChoice: "",
        theNum: "",
        theBool: false,
        theDate: null,
        theArray: [],
        theObject: { foo: "" },
        theObjectArray: { arr: [] },
      });
    }

    {
      const { result: stringFieldHook } = renderHook(
        () => useField(Schema.theObject),
        { wrapper }
      );

      expect(stringFieldHook.current).toMatchObject({
        id: "theObject",
        value: { foo: "" },
        error: null,
        isTouched: false,
        isValid: true,
        isValidating: false,
        descriptor: Schema.theObject,
        setValue: expect.any(Function),
        setError: expect.any(Function),
        validate: expect.any(Function),
        handleBlur: expect.any(Function),
        children: {
          foo: {
            id: "theObject.foo",
            value: "",
            error: null,
            isTouched: false,
            isValid: true,
            isValidating: false,
            descriptor: Schema.theObject.foo,
            setValue: expect.any(Function),
            setError: expect.any(Function),
            validate: expect.any(Function),
            handleBlur: expect.any(Function),
          },
        },
      });
    }
  });

  it("initializes form state using default values", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema })
    );

    const { result: formValuesHook } = renderHook(() =>
      useFormValues(Schema, controllerHook.current)
    );

    const values = formValuesHook.current;
    expect(values).toEqual({
      theString: "",
      theChoice: "",
      theNum: "",
      theBool: false,
      theDate: null,
      theArray: [],
      theObject: { foo: "" },
      theObjectArray: { arr: [] },
    });
  });

  it("initializes form state using default values merged with custom initial values", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({
        Schema,
        initialValues: {
          theChoice: "C",
          theNum: 42,
          theArray: ["here", "comes", "the", "sun"],
          theObject: { foo: "bar" },
        },
      })
    );

    const { result: formValuesHook } = renderHook(() =>
      useFormValues(Schema, controllerHook.current)
    );

    const values = formValuesHook.current;
    expect(values).toEqual({
      theString: "",
      theChoice: "C",
      theNum: 42,
      theBool: false,
      theDate: null,
      theArray: ["here", "comes", "the", "sun"],
      theObject: { foo: "bar" },
      theObjectArray: { arr: [] },
    });
  });

  it("allows for getting values using corresponding field handles", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({
        Schema,
        initialValues: {
          theChoice: "C",
          theNum: 42,
          theArray: ["here", "comes", "the", "sun"],
          theObject: { foo: "bar" },
        },
      })
    );

    {
      const {
        result: { current: field },
      } = renderHook(() => useField(Schema.theChoice, controllerHook.current));

      expect(field.value).toEqual("C");
    }

    {
      const {
        result: { current: field },
      } = renderHook(() => useField(Schema.theNum, controllerHook.current));

      expect(field.value).toEqual(42);
    }

    {
      const {
        result: { current: field },
      } = renderHook(() => useField(Schema.theArray, controllerHook.current));

      expect(field.value).toEqual(["here", "comes", "the", "sun"]);
      expect(field.children[3]?.value).toEqual("sun");
      expect(field.children[42]?.value).toEqual(undefined);
    }

    {
      const {
        result: { current: field },
      } = renderHook(() => useField(Schema.theObject, controllerHook.current));

      expect(field.value).toEqual({ foo: "bar" });
      expect(field.children.foo.value).toEqual("bar");
    }

    {
      const {
        result: { current: field },
      } = renderHook(() =>
        useField(Schema.theObjectArray, controllerHook.current)
      );

      expect(field.value).toEqual({ arr: [] });
    }
  });

  it("allows for setting field values and keeps track of touched state", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema })
    );
    const {
      result: formHandleHook,
      rerender: rerenderFormHandleHook,
    } = renderHook(() => useFormHandle(Schema, controllerHook.current));
    const {
      result: formValuesHook,
      rerender: rerenderFormValuesHook,
    } = renderHook(() => useFormValues(Schema, controllerHook.current));
    const {
      result: numberFieldHook,
      rerender: rerenderNumberFieldHook,
    } = renderHook(() => useField(Schema.theNum, controllerHook.current));
    const {
      result: arrayFieldHook,
      rerender: rerenderArrayFieldHook,
    } = renderHook(() => useField(Schema.theArray, controllerHook.current));
    const {
      result: objectFieldHook,
      rerender: rerenderObjectFieldHook,
    } = renderHook(() => useField(Schema.theObject, controllerHook.current));

    const rerenderHooks = () => {
      rerenderFormHandleHook();
      rerenderFormValuesHook();
      rerenderNumberFieldHook();
      rerenderArrayFieldHook();
      rerenderObjectFieldHook();
    };

    {
      expect(formHandleHook.current.isTouched).toBe(false);
      expect(formValuesHook.current).toEqual({
        theString: "",
        theChoice: "",
        theNum: "",
        theBool: false,
        theDate: null,
        theArray: [],
        theObject: { foo: "" },
        theObjectArray: { arr: [] },
      });

      expect(numberFieldHook.current.isTouched).toBe(false);
      expect(numberFieldHook.current.value).toEqual("");

      expect(arrayFieldHook.current.isTouched).toBe(false);
      expect(arrayFieldHook.current.value).toEqual([]);

      expect(objectFieldHook.current.isTouched).toBe(false);
      expect(objectFieldHook.current.value).toEqual({ foo: "" });
    }

    act(() => {
      numberFieldHook.current.setValue(42);
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isTouched).toBe(true);
      expect(formValuesHook.current).toEqual({
        theString: "",
        theChoice: "",
        theNum: 42,
        theBool: false,
        theDate: null,
        theArray: [],
        theObject: { foo: "" },
        theObjectArray: { arr: [] },
      });

      expect(numberFieldHook.current.isTouched).toBe(true);
      expect(numberFieldHook.current.value).toEqual(42);

      expect(arrayFieldHook.current.isTouched).toBe(false);
      expect(arrayFieldHook.current.value).toEqual([]);

      expect(objectFieldHook.current.isTouched).toBe(false);
      expect(objectFieldHook.current.value).toEqual({ foo: "" });
    }

    act(() => {
      formHandleHook.current.setFieldValue(Schema.theArray, [
        "gumisie",
        "teletubisie",
      ]);
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isTouched).toBe(true);
      expect(formValuesHook.current).toEqual({
        theString: "",
        theChoice: "",
        theNum: 42,
        theBool: false,
        theDate: null,
        theArray: ["gumisie", "teletubisie"],
        theObject: { foo: "" },
        theObjectArray: { arr: [] },
      });

      expect(numberFieldHook.current.isTouched).toBe(true);
      expect(numberFieldHook.current.value).toEqual(42);

      expect(arrayFieldHook.current.isTouched).toBe(true);
      expect(arrayFieldHook.current.value).toEqual(["gumisie", "teletubisie"]);

      expect(objectFieldHook.current.isTouched).toBe(false);
      expect(objectFieldHook.current.value).toEqual({ foo: "" });
    }

    act(() => {
      objectFieldHook.current.children.foo.setValue("42");
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isTouched).toBe(true);
      expect(formValuesHook.current).toEqual({
        theString: "",
        theChoice: "",
        theNum: 42,
        theBool: false,
        theDate: null,
        theArray: ["gumisie", "teletubisie"],
        theObject: { foo: "42" },
        theObjectArray: { arr: [] },
      });

      expect(numberFieldHook.current.isTouched).toBe(true);
      expect(numberFieldHook.current.value).toEqual(42);

      expect(arrayFieldHook.current.isTouched).toBe(true);
      expect(arrayFieldHook.current.value).toEqual(["gumisie", "teletubisie"]);

      expect(objectFieldHook.current.isTouched).toBe(true);
      expect(objectFieldHook.current.value).toEqual({ foo: "42" });
    }
  });

  it("keeps track of isChanged flag for individual fields and the form as a whole", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({
        Schema,
        initialValues: {
          theNum: 42,
          theObjectArray: { arr: ["1", "2"] },
        },
      })
    );
    const {
      result: formHandleHook,
      rerender: rerenderFormHandleHook,
    } = renderHook(() => useFormHandle(Schema, controllerHook.current));
    const {
      result: numberFieldHook,
      rerender: rerenderNumberFieldHook,
    } = renderHook(() => useField(Schema.theNum, controllerHook.current));
    const {
      result: objectArrayFieldHook,
      rerender: rerenderObjectArrayFieldHook,
    } = renderHook(() =>
      useField(Schema.theObjectArray, controllerHook.current)
    );
    const {
      result: nestedArrayFieldHook,
      rerender: rerenderNestedArrayFieldHook,
    } = renderHook(() =>
      useField(Schema.theObjectArray.arr, controllerHook.current)
    );

    const rerenderHooks = () => {
      rerenderFormHandleHook();
      rerenderNumberFieldHook();
      rerenderObjectArrayFieldHook();
      rerenderNestedArrayFieldHook();
    };

    {
      expect(formHandleHook.current.isChanged).toBe(false);
      expect(numberFieldHook.current.isChanged).toBe(false);
      expect(objectArrayFieldHook.current.isChanged).toBe(false);
      expect(nestedArrayFieldHook.current.isChanged).toBe(false);
    }

    {
      act(() => {
        numberFieldHook.current.setValue(1);
        rerenderHooks();
      });
    }

    {
      expect(formHandleHook.current.isChanged).toBe(true);
      expect(numberFieldHook.current.isChanged).toBe(true);
      expect(objectArrayFieldHook.current.isChanged).toBe(false);
      expect(nestedArrayFieldHook.current.isChanged).toBe(false);
    }

    {
      act(() => {
        nestedArrayFieldHook.current.setValue(["1", "2"]);
        rerenderHooks();
      });
    }

    {
      expect(formHandleHook.current.isChanged).toBe(true);
      expect(numberFieldHook.current.isChanged).toBe(true);
      expect(objectArrayFieldHook.current.isChanged).toBe(false);
      expect(nestedArrayFieldHook.current.isChanged).toBe(false);
    }

    {
      act(() => {
        nestedArrayFieldHook.current.setValue(["1", "2", "3"]);
        rerenderHooks();
      });
    }

    {
      expect(formHandleHook.current.isChanged).toBe(true);
      expect(numberFieldHook.current.isChanged).toBe(true);
      expect(objectArrayFieldHook.current.isChanged).toBe(true);
      expect(nestedArrayFieldHook.current.isChanged).toBe(true);
    }

    {
      act(() => {
        numberFieldHook.current.setValue(42);
        nestedArrayFieldHook.current.setValue(["1", "2"]);
        rerenderHooks();
      });
    }

    {
      expect(formHandleHook.current.isChanged).toBe(false);
      expect(numberFieldHook.current.isChanged).toBe(false);
      expect(objectArrayFieldHook.current.isChanged).toBe(false);
      expect(nestedArrayFieldHook.current.isChanged).toBe(false);
    }
  });

  it("allows for setting field values based on change events", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema })
    );

    const {
      result: numberFieldHook,
      rerender: rerenderNumberFieldHook,
    } = renderHook(() => useField(Schema.theNum, controllerHook.current));

    {
      expect(numberFieldHook.current.value).toEqual("");
      expect(numberFieldHook.current.isTouched).toBe(false);
    }

    act(() => {
      numberFieldHook.current.handleChange({ target: { value: "42" } } as any);
      rerenderNumberFieldHook();
    });

    {
      expect(numberFieldHook.current.value).toEqual(42);
      expect(numberFieldHook.current.isTouched).toBe(true);
    }
  });

  it("allows for adding and removing array field items", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema })
    );
    const {
      result: arrayFieldHook,
      rerender: rerenderArrayFieldHook,
    } = renderHook(() => useField(Schema.theArray, controllerHook.current));

    {
      expect(arrayFieldHook.current.isTouched).toBe(false);
      expect(arrayFieldHook.current.value).toEqual([]);
    }

    act(() => {
      arrayFieldHook.current.addItem("foo");
      rerenderArrayFieldHook();
    });

    act(() => {
      arrayFieldHook.current.addItem("bar");
      rerenderArrayFieldHook();
    });

    {
      expect(arrayFieldHook.current.isTouched).toBe(true);
      expect(arrayFieldHook.current.value).toEqual(["foo", "bar"]);
    }

    act(() => {
      arrayFieldHook.current.removeItem(0);
      rerenderArrayFieldHook();
    });

    {
      expect(arrayFieldHook.current.isTouched).toBe(true);
      expect(arrayFieldHook.current.value).toEqual(["bar"]);
    }
  });

  it("clears errors corresponding to removed array values", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema })
    );
    const {
      result: formHandleHook,
      rerender: rerenderFormHandleHook,
    } = renderHook(() => useFormHandle(Schema, controllerHook.current));
    const {
      result: arrayFieldHook,
      rerender: rerenderArrayFieldHook,
    } = renderHook(() => useField(Schema.theArray, controllerHook.current));

    const rerenderHooks = () => {
      rerenderFormHandleHook();
      rerenderArrayFieldHook();
    };

    act(() => {
      arrayFieldHook.current.setValue(["A", "B", "C"]);
      rerenderHooks();
    });
    act(() => {
      arrayFieldHook.current.children[2].setError("ERR");
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isValid).toBe(false);
      expect(arrayFieldHook.current.isValid).toBe(false);
    }

    act(() => {
      arrayFieldHook.current.setValue(["A", "B"]);
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isValid).toBe(true);
      expect(arrayFieldHook.current.isValid).toBe(true);
    }
  });

  it("exposes options of choice fields", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema })
    );
    const { result: choiceFieldHook } = renderHook(() =>
      useField(Schema.theChoice, controllerHook.current)
    );

    expect(choiceFieldHook.current.options).toEqual({
      A: "A",
      B: "B",
      C: "C",
    });
  });

  it("allows for setting field errors and keeps track of isValid state", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema })
    );
    const {
      result: formHandleHook,
      rerender: rerenderFormHandleHook,
    } = renderHook(() => useFormHandle(Schema, controllerHook.current));
    const {
      result: numberFieldHook,
      rerender: rerenderNumberFieldHook,
    } = renderHook(() => useField(Schema.theNum, controllerHook.current));
    const {
      result: arrayFieldHook,
      rerender: rerenderArrayFieldHook,
    } = renderHook(() => useField(Schema.theArray, controllerHook.current));
    const {
      result: objectFieldHook,
      rerender: rerenderObjectFieldHook,
    } = renderHook(() => useField(Schema.theObject, controllerHook.current));

    const rerenderHooks = () => {
      rerenderFormHandleHook();
      rerenderNumberFieldHook();
      rerenderArrayFieldHook();
      rerenderObjectFieldHook();
    };

    {
      expect(formHandleHook.current.isValid).toBe(true);

      expect(numberFieldHook.current.isValid).toBe(true);
      expect(numberFieldHook.current.error).toBe(null);

      expect(arrayFieldHook.current.isValid).toBe(true);
      expect(arrayFieldHook.current.error).toBe(null);

      expect(objectFieldHook.current.isValid).toBe(true);
      expect(objectFieldHook.current.error).toBe(null);
    }

    act(() => {
      numberFieldHook.current.setError("ERR_1");
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isValid).toBe(false);

      expect(numberFieldHook.current.isValid).toBe(false);
      expect(numberFieldHook.current.error).toBe("ERR_1");

      expect(arrayFieldHook.current.isValid).toBe(true);
      expect(arrayFieldHook.current.error).toBe(null);

      expect(objectFieldHook.current.isValid).toBe(true);
      expect(objectFieldHook.current.error).toBe(null);
    }

    act(() => {
      formHandleHook.current.setFieldError(Schema.theArray, "ERR_2");
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isValid).toBe(false);

      expect(numberFieldHook.current.isValid).toBe(false);
      expect(numberFieldHook.current.error).toBe("ERR_1");

      expect(arrayFieldHook.current.isValid).toBe(false);
      expect(arrayFieldHook.current.error).toBe("ERR_2");

      expect(objectFieldHook.current.isValid).toBe(true);
      expect(objectFieldHook.current.error).toBe(null);
    }

    act(() => {
      objectFieldHook.current.children.foo.setError("ERR_3");
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isValid).toBe(false);

      expect(numberFieldHook.current.isValid).toBe(false);
      expect(numberFieldHook.current.error).toBe("ERR_1");

      expect(arrayFieldHook.current.isValid).toBe(false);
      expect(arrayFieldHook.current.error).toBe("ERR_2");

      expect(objectFieldHook.current.isValid).toBe(false);
      expect(objectFieldHook.current.error).toBe(null);
      expect(objectFieldHook.current.children.foo.isValid).toBe(false);
      expect(objectFieldHook.current.children.foo.error).toBe("ERR_3");
    }
  });

  it("resets form state to initial when FormHandle reset method is called", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema, initialValues: { theNum: 42 } })
    );
    const {
      result: numberFieldHook,
      rerender: rerenderNumberFieldHook,
    } = renderHook(() => useField(Schema.theNum, controllerHook.current));
    const {
      result: formHandleHook,
      rerender: rerenderFormHandleHook,
    } = renderHook(() => useFormHandle(Schema, controllerHook.current));
    const {
      result: formValuesHook,
      rerender: rerenderFormValuesHook,
    } = renderHook(() => useFormValues(Schema, controllerHook.current));

    const rerenderHooks = () => {
      rerenderNumberFieldHook();
      rerenderFormHandleHook();
      rerenderFormValuesHook();
    };

    act(() => {
      formHandleHook.current.setFieldValue(Schema.theNum, 666);
      formHandleHook.current.setFieldError(Schema.theNum, "ERR");
      formHandleHook.current.setFieldValue(Schema.theObject.foo, "bar");
      rerenderHooks();
    });

    {
      expect(numberFieldHook.current.isChanged).toBe(true);
      expect(formHandleHook.current.isChanged).toBe(true);
      expect(formHandleHook.current.isValid).toBe(false);
      expect(formHandleHook.current.isTouched).toBe(true);

      expect(numberFieldHook.current.value).toBe(666);
      expect(formValuesHook.current).toEqual({
        theString: "",
        theChoice: "",
        theNum: 666,
        theBool: false,
        theDate: null,
        theArray: [],
        theObject: { foo: "bar" },
        theObjectArray: { arr: [] },
      });
    }

    act(() => {
      formHandleHook.current.reset();
      rerenderHooks();
    });

    {
      expect(numberFieldHook.current.isChanged).toBe(false);
      expect(formHandleHook.current.isChanged).toBe(false);
      expect(formHandleHook.current.isValid).toBe(true);
      expect(formHandleHook.current.isTouched).toBe(false);

      expect(numberFieldHook.current.value).toBe(42);
      expect(formValuesHook.current).toEqual({
        theString: "",
        theChoice: "",
        theNum: 42,
        theBool: false,
        theDate: null,
        theArray: [],
        theObject: { foo: "" },
        theObjectArray: { arr: [] },
      });
    }
  });

  it("changes initial values and resets form state when FormHandle reset method is called with an argument", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema, initialValues: { theNum: 42 } })
    );
    const {
      result: numberFieldHook,
      rerender: rerenderNumberFieldHook,
    } = renderHook(() => useField(Schema.theNum, controllerHook.current));
    const {
      result: formHandleHook,
      rerender: rerenderFormHandleHook,
    } = renderHook(() => useFormHandle(Schema, controllerHook.current));
    const {
      result: formValuesHook,
      rerender: rerenderFormValuesHook,
    } = renderHook(() => useFormValues(Schema, controllerHook.current));

    const rerenderHooks = () => {
      rerenderNumberFieldHook();
      rerenderFormHandleHook();
      rerenderFormValuesHook();
    };

    act(() => {
      formHandleHook.current.setFieldValue(Schema.theNum, 666);
      formHandleHook.current.setFieldError(Schema.theNum, "ERR");
      formHandleHook.current.setFieldValue(Schema.theObject.foo, "bar");
      rerenderHooks();
    });

    {
      expect(numberFieldHook.current.isChanged).toBe(true);
      expect(formHandleHook.current.isChanged).toBe(true);
      expect(formHandleHook.current.isValid).toBe(false);
      expect(formHandleHook.current.isTouched).toBe(true);

      expect(numberFieldHook.current.value).toBe(666);
      expect(formValuesHook.current).toEqual({
        theString: "",
        theChoice: "",
        theNum: 666,
        theBool: false,
        theDate: null,
        theArray: [],
        theObject: { foo: "bar" },
        theObjectArray: { arr: [] },
      });
    }

    act(() => {
      formHandleHook.current.reset({
        theNum: 666,
        theBool: true,
      });
      rerenderHooks();
    });

    {
      expect(numberFieldHook.current.isChanged).toBe(false);
      expect(formHandleHook.current.isChanged).toBe(false);
      expect(formHandleHook.current.isValid).toBe(true);
      expect(formHandleHook.current.isTouched).toBe(false);

      expect(numberFieldHook.current.value).toBe(666);
      expect(formValuesHook.current).toEqual({
        theString: "",
        theChoice: "",
        theNum: 666,
        theBool: true,
        theDate: null,
        theArray: [],
        theObject: { foo: "" },
        theObjectArray: { arr: [] },
      });
    }
  });

  it("resets field state to initial when FieldHandle reset method is called", () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({
        Schema,
        initialValues: { theObject: { foo: "42" } },
      })
    );
    const {
      result: numberFieldHook,
      rerender: rerenderNumberFieldHook,
    } = renderHook(() => useField(Schema.theNum, controllerHook.current));
    const {
      result: objectFieldHook,
      rerender: rerenderObjectFieldHook,
    } = renderHook(() => useField(Schema.theObject, controllerHook.current));
    const {
      result: nestedFooFieldHook,
      rerender: rerenderNestedFooFieldHook,
    } = renderHook(() =>
      useField(Schema.theObject.foo, controllerHook.current)
    );

    const rerenderHooks = () => {
      rerenderNumberFieldHook();
      rerenderObjectFieldHook();
      rerenderNestedFooFieldHook();
    };

    {
      expect(numberFieldHook.current.isChanged).toBe(false);
      expect(numberFieldHook.current.isTouched).toBe(false);
      expect(numberFieldHook.current.isValid).toBe(true);
      expect(numberFieldHook.current.value).toEqual("");

      expect(objectFieldHook.current.isChanged).toBe(false);
      expect(objectFieldHook.current.isTouched).toBe(false);
      expect(objectFieldHook.current.isValid).toBe(true);
      expect(objectFieldHook.current.value).toEqual({ foo: "42" });

      expect(nestedFooFieldHook.current.isChanged).toBe(false);
      expect(nestedFooFieldHook.current.isTouched).toBe(false);
      expect(nestedFooFieldHook.current.isValid).toBe(true);
      expect(nestedFooFieldHook.current.value).toEqual("42");
    }

    {
      act(() => {
        numberFieldHook.current.setValue(42);
        objectFieldHook.current.setError("test error");
        nestedFooFieldHook.current.setValue("24");
        rerenderHooks();
      });
    }

    {
      expect(numberFieldHook.current.isChanged).toBe(true);
      expect(numberFieldHook.current.isTouched).toBe(true);
      expect(numberFieldHook.current.isValid).toBe(true);
      expect(numberFieldHook.current.value).toEqual(42);

      expect(objectFieldHook.current.isChanged).toBe(true);
      expect(objectFieldHook.current.isTouched).toBe(true);
      expect(objectFieldHook.current.isValid).toBe(false);
      expect(objectFieldHook.current.value).toEqual({ foo: "24" });

      expect(nestedFooFieldHook.current.isChanged).toBe(true);
      expect(nestedFooFieldHook.current.isTouched).toBe(true);
      expect(nestedFooFieldHook.current.isValid).toBe(true);
      expect(nestedFooFieldHook.current.value).toEqual("24");
    }

    {
      act(() => {
        objectFieldHook.current.reset();
        rerenderHooks();
      });
    }

    {
      expect(numberFieldHook.current.isChanged).toBe(true);
      expect(numberFieldHook.current.isTouched).toBe(true);
      expect(numberFieldHook.current.isValid).toBe(true);
      expect(numberFieldHook.current.value).toEqual(42);

      expect(objectFieldHook.current.isChanged).toBe(false);
      expect(objectFieldHook.current.isTouched).toBe(false);
      expect(objectFieldHook.current.isValid).toBe(true);
      expect(objectFieldHook.current.value).toEqual({ foo: "42" });

      expect(nestedFooFieldHook.current.isChanged).toBe(false);
      expect(nestedFooFieldHook.current.isTouched).toBe(false);
      expect(nestedFooFieldHook.current.isValid).toBe(true);
      expect(nestedFooFieldHook.current.value).toEqual("42");
    }
  });

  it("validates field when FieldHandle blur handler is called", async () => {
    const validator = opaque({
      validate: jest
        .fn()
        .mockReturnValueOnce(Task.success([{ path: "theNum", error: "ERR_1" }]))
        .mockReturnValueOnce(Task.success([{ path: "theNum", error: null }])),
    });

    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema, validator })
    );
    const {
      result: formHandleHook,
      rerender: rerenderFormHandleHook,
    } = renderHook(() => useFormHandle(Schema, controllerHook.current));
    const {
      result: numberFieldHook,
      rerender: rerenderNumberFieldHook,
    } = renderHook(() => useField(Schema.theNum, controllerHook.current));

    const rerenderHooks = () => {
      rerenderFormHandleHook();
      rerenderNumberFieldHook();
    };

    {
      expect(formHandleHook.current.isValid).toBe(true);

      expect(numberFieldHook.current.isValid).toBe(true);
      expect(numberFieldHook.current.error).toBe(null);

      expect(impl(validator).validate).not.toHaveBeenCalled();
    }

    await act(async () => {
      await numberFieldHook.current.handleBlur();
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isValid).toBe(false);

      expect(numberFieldHook.current.isValid).toBe(false);
      expect(numberFieldHook.current.error).toBe("ERR_1");

      expect(impl(validator).validate).toHaveBeenCalledTimes(1);
    }

    await act(async () => {
      await numberFieldHook.current.handleBlur();
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isValid).toBe(true);

      expect(numberFieldHook.current.isValid).toBe(true);
      expect(numberFieldHook.current.error).toBe(null);

      expect(impl(validator).validate).toHaveBeenCalledTimes(2);
    }
  });

  it("validates field when FieldHandle validate method is called", async () => {
    const validator = opaque({
      validate: jest
        .fn()
        .mockReturnValueOnce(Task.success([{ path: "theNum", error: "ERR_1" }]))
        .mockReturnValueOnce(Task.success([{ path: "theNum", error: null }])),
    });

    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema, validator })
    );
    const {
      result: formHandleHook,
      rerender: rerenderFormHandleHook,
    } = renderHook(() => useFormHandle(Schema, controllerHook.current));
    const {
      result: numberFieldHook,
      rerender: rerenderNumberFieldHook,
    } = renderHook(() => useField(Schema.theNum, controllerHook.current));

    const rerenderHooks = () => {
      rerenderFormHandleHook();
      rerenderNumberFieldHook();
    };

    {
      expect(formHandleHook.current.isValid).toBe(true);

      expect(numberFieldHook.current.isValid).toBe(true);
      expect(numberFieldHook.current.error).toBe(null);

      expect(impl(validator).validate).not.toHaveBeenCalled();
    }

    await act(async () => {
      await numberFieldHook.current.validate();
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isValid).toBe(false);

      expect(numberFieldHook.current.isValid).toBe(false);
      expect(numberFieldHook.current.error).toBe("ERR_1");

      expect(impl(validator).validate).toHaveBeenCalledTimes(1);
    }

    await act(async () => {
      await numberFieldHook.current.validate();
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isValid).toBe(true);

      expect(numberFieldHook.current.isValid).toBe(true);
      expect(numberFieldHook.current.error).toBe(null);

      expect(impl(validator).validate).toHaveBeenCalledTimes(2);
    }
  });

  it("validates field when its values is changed", async () => {
    const validator = opaque({
      validate: jest
        .fn()
        .mockImplementation(({ fields, getValue }: ValidateIn<any>) =>
          Task.success(
            fields.map(field => ({
              path: impl(field).__path,
              error: getValue(field) === "" ? "REQUIRED" : null,
            }))
          )
        ),
    });

    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema, validator })
    );
    const {
      result: formHandleHook,
      rerender: rerenderFormHandleHook,
    } = renderHook(() => useFormHandle(Schema, controllerHook.current));
    const {
      result: numberFieldHook,
      rerender: rerenderNumberFieldHook,
    } = renderHook(() => useField(Schema.theNum, controllerHook.current));

    const rerenderHooks = () => {
      rerenderFormHandleHook();
      rerenderNumberFieldHook();
    };

    {
      expect(formHandleHook.current.isValid).toBe(true);

      expect(numberFieldHook.current.isValid).toBe(true);
      expect(numberFieldHook.current.error).toBe(null);

      expect(impl(validator).validate).not.toHaveBeenCalled();
    }

    await act(async () => {
      await numberFieldHook.current.setValue(42);
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isValid).toBe(true);

      expect(numberFieldHook.current.isValid).toBe(true);
      expect(numberFieldHook.current.error).toBe(null);

      expect(impl(validator).validate).toHaveBeenCalledTimes(1);
    }

    await act(async () => {
      await formHandleHook.current.setFieldValue(Schema.theNum, "");
      rerenderHooks();
    });

    {
      expect(formHandleHook.current.isValid).toBe(false);

      expect(numberFieldHook.current.isValid).toBe(false);
      expect(numberFieldHook.current.error).toBe("REQUIRED");

      expect(impl(validator).validate).toHaveBeenCalledTimes(2);
    }
  });

  it("validates all fields when form validate method is called", async () => {
    const validator = opaque({
      validate: jest
        .fn()
        .mockImplementation(({ fields }: ValidateIn<any>) =>
          Task.success(
            fields.map(field => ({ path: impl(field).__path, error: "ERROR" }))
          )
        ),
    });

    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema, validator })
    );
    const {
      result: formHandleHook,
      rerender: rerenderFormHandleHook,
    } = renderHook(() => useFormHandle(Schema, controllerHook.current));
    const {
      result: numberFieldHook,
      rerender: rerenderNumberFieldHook,
    } = renderHook(() => useField(Schema.theNum, controllerHook.current));

    const rerenderHooks = () => {
      rerenderFormHandleHook();
      rerenderNumberFieldHook();
    };

    {
      expect(impl(validator).validate).not.toHaveBeenCalled();

      expect(formHandleHook.current.isValid).toBe(true);

      expect(numberFieldHook.current.isValid).toBe(true);
      expect(numberFieldHook.current.error).toBe(null);
    }

    await act(async () => {
      await formHandleHook.current.validate();
      rerenderHooks();
    });

    {
      expect(impl(validator).validate).toHaveBeenCalledTimes(1);

      expect(formHandleHook.current.isValid).toBe(false);

      expect(numberFieldHook.current.isValid).toBe(false);
      expect(numberFieldHook.current.error).toBe("ERROR");
    }
  });

  it("creates submit handler which runs validation of all fields and invokes proper callback", async () => {
    const validator = opaque({
      validate: jest
        .fn()
        .mockImplementationOnce(({ fields }: ValidateIn<any>) =>
          Task.success(
            fields.map(field => ({ path: impl(field).__path, error: "ERROR" }))
          )
        )
        .mockReturnValueOnce(Task.success([])),
    });

    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema, validator })
    );
    const { result: formHandleHook } = renderHook(() =>
      useFormHandle(Schema, controllerHook.current)
    );

    const onSuccess = jest.fn();
    const onFailure = jest.fn();

    {
      const { submitCount } = formHandleHook.current;

      expect(impl(validator).validate).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).not.toHaveBeenCalled();
      expect(submitCount.total).toBe(0);
      expect(submitCount.valid).toBe(0);
      expect(submitCount.invalid).toBe(0);
    }

    await act(async () => {
      const { submit } = formHandleHook.current;
      await submit(onSuccess, onFailure);
    });

    {
      const { submitCount } = formHandleHook.current;

      expect(impl(validator).validate).toHaveBeenCalledTimes(1);
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onFailure).toHaveBeenCalledWith([
        { path: "theString", error: "ERROR" },
        { path: "theChoice", error: "ERROR" },
        { path: "theNum", error: "ERROR" },
        { path: "theBool", error: "ERROR" },
        { path: "theDate", error: "ERROR" },
        { path: "theArray", error: "ERROR" },
        { path: "theObject", error: "ERROR" },
        { path: "theObjectArray", error: "ERROR" },
      ]);
      expect(submitCount.total).toBe(1);
      expect(submitCount.valid).toBe(0);
      expect(submitCount.invalid).toBe(1);
    }

    await act(async () => {
      const { submit } = formHandleHook.current;
      await submit(onSuccess, onFailure);
    });

    {
      const { submitCount } = formHandleHook.current;

      expect(impl(validator).validate).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith({
        theString: "",
        theChoice: "",
        theNum: "",
        theBool: false,
        theDate: null,
        theArray: [],
        theObject: { foo: "" },
        theObjectArray: { arr: [] },
      });
      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(submitCount.total).toBe(2);
      expect(submitCount.valid).toBe(1);
      expect(submitCount.invalid).toBe(1);
    }
  });

  it("creates submit handler which marks all fields as touched", async () => {
    const { result: controllerHook } = renderHook(() =>
      useFormController({ Schema })
    );
    const { result: formHandleHook } = renderHook(() =>
      useFormHandle(Schema, controllerHook.current)
    );

    const { result: theNumFieldHook } = renderHook(() =>
      useField(Schema.theNum, controllerHook.current)
    );
    const { result: theObjectFooFieldHook } = renderHook(() =>
      useField(Schema.theObject.foo, controllerHook.current)
    );
    const { result: theArrayItemFieldHook } = renderHook(() =>
      useField(Schema.theArray.nth(0), controllerHook.current)
    );

    const onSuccess = jest.fn();
    const onFailure = jest.fn();

    {
      expect(formHandleHook.current.isTouched).toBeFalsy();
      expect(theNumFieldHook.current.isTouched).toBeFalsy();
      expect(theObjectFooFieldHook.current.isTouched).toBeFalsy();
      expect(theArrayItemFieldHook.current.isTouched).toBeFalsy();
    }

    await act(async () => {
      const { submit } = formHandleHook.current;
      await submit(onSuccess, onFailure);
    });

    {
      expect(formHandleHook.current.isTouched).toBeTruthy();
      expect(theNumFieldHook.current.isTouched).toBeTruthy();
      expect(theObjectFooFieldHook.current.isTouched).toBeTruthy();
      expect(theArrayItemFieldHook.current.isTouched).toBeTruthy();
    }
  });

  it("useField should not accept FieldTemplate", () => {
    const mockUseField: typeof useField = jest.fn();

    // @ts-expect-error
    mockUseField(Schema.theArray.every());
  });

  it("FormHandle:setFieldValue/setFieldError should not accept FieldTemplate", () => {
    const mockFormHandle: FormHandle<{}, {}> = {
      setFieldError: jest.fn(),
      setFieldValue: jest.fn(),
    } as any;

    // @ts-expect-error
    mockFormHandle.setFieldValue(Schema.theArray.every(), []);
    // @ts-expect-error
    mockFormHandle.setFieldError(Schema.theArray.every(), null);
  });
});
