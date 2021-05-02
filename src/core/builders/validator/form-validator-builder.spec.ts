import { assert, IsExact } from "conditional-type-checks";

import { Task } from "../../../utils/task";
import * as validators from "../../../validators";
import { FieldDescriptor } from "../../types/field-descriptor";
import { FormValidator } from "../../types/form-validator";
import { impl } from "../../types/type-mapper-util";
import { FormFields, FormSchemaBuilder } from "../schema";

import { createFormValidator } from "./create-form-validator";

export const wait = <T extends string | null>(value: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(value), 0));

describe("createFormValidator types", () => {
  const Schema = new FormSchemaBuilder()
    .fields({
      string: FormFields.string(),
      choice: FormFields.choice("A", "B", "C"),
      num: FormFields.number(),
      bool: FormFields.bool(),
    })
    .errors<"err1" | "err2">()
    .build();

  it("resolves ok", () => {
    const formValidator = createFormValidator(Schema, _validate => []);

    type Actual = typeof formValidator;
    type Expected = FormValidator<
      {
        string: string;
        choice: "A" | "B" | "C";
        num: number | "";
        bool: boolean;
      },
      "err1" | "err2"
    >;

    assert<IsExact<Actual, Expected>>(true);
  });
});

describe("createFormValidator", () => {
  const Schema = new FormSchemaBuilder()
    .fields({
      string: FormFields.string(),
      number: FormFields.number(),
      choice: FormFields.choice("A", "B", "C"),
      date: FormFields.date(),
      arrayString: FormFields.array(FormFields.string()),
      arrayChoice: FormFields.array(FormFields.choice("a", "b", "c")),
      arrayArrayString: FormFields.array(FormFields.array(FormFields.string())),
      object: FormFields.object({
        str: FormFields.string(),
        num: FormFields.number(),
      }),
      arrayObjectString: FormFields.array(
        FormFields.object({ str: FormFields.string() })
      ),
      objectArray: FormFields.object({
        arrayString: FormFields.array(FormFields.string()),
      }),
      objectObjectArrayObjectString: FormFields.object({
        obj: FormFields.object({
          array: FormFields.array(
            FormFields.object({ str: FormFields.string() })
          ),
        }),
      }),
      objectTwoArrays: FormFields.object({
        arrayString: FormFields.array(FormFields.string()),
        arrayNumber: FormFields.array(FormFields.number()),
      }),
      arrayNestedArrays: FormFields.array(
        FormFields.object({ array: FormFields.array(FormFields.string()) })
      ),
    })
    .errors<"REQUIRED" | "TOO_SHORT" | "INVALID_VALUE">()
    .build();

  const createFormValidatorImpl = (
    ...args: Parameters<typeof createFormValidator>
  ) => impl(createFormValidator(...args));

  it("should return ERR for failing single-rule on string field", async () => {
    const stringRequiredValidator = (x: string) => (x ? null : "REQUIRED");
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator],
      }),
    ]);
    const getValue = () => "" as any;

    const validation = await validate({
      fields: [Schema.string],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "string", error: "REQUIRED" }]);
  });

  it("should return null for passing single-rule on string field", async () => {
    const stringRequiredValidator = (x: string) => (x ? null : "REQUIRED");
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator],
      }),
    ]);
    const getValue = () => "defined string" as any;

    const validation = await validate({
      fields: [Schema.string],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "string", error: null }]);
  });

  it("should return ERR for failing all of multiple-rule on string field", async () => {
    const stringRequiredValidator = (x: string) =>
      x !== "" ? null : "REQUIRED";
    const stringLengthValidator = (x: string) =>
      x.length > 3 ? null : "TOO_SHORT";
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator, stringLengthValidator],
      }),
    ]);
    const getValue = () => "" as any;

    const validation = await validate({
      fields: [Schema.string],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "string", error: "REQUIRED" }]);
  });

  it("should return ERR for failing last of multiple-rule on string field", async () => {
    const stringRequiredValidator = (x: string) =>
      x !== "" ? null : "REQUIRED";
    const stringLengthValidator = (x: string) =>
      x.length > 3 ? null : "TOO_SHORT";
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator, stringLengthValidator],
      }),
    ]);
    const getValue = () => "ab" as any;

    const validation = await validate({
      fields: [Schema.string],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "string", error: "TOO_SHORT" }]);
  });

  it("should return null for passing all of multiple-rule on string field", async () => {
    const stringRequiredValidator = (x: string) =>
      x !== "" ? null : "REQUIRED";
    const stringLengthValidator = (x: string) =>
      x.length > 3 ? null : "TOO_SHORT";
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator, stringLengthValidator],
      }),
    ]);
    const getValue = () => "abcd" as any;

    const validation = await validate({
      fields: [Schema.string],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "string", error: null }]);
  });

  it("should return ERR for failing single-rule on choice field ", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.choice,
        rules: () => [x => (x === "A" ? "INVALID_VALUE" : null)],
      }),
    ]);
    const getValue = () => "A" as any;

    const validation = await validate({
      fields: [Schema.choice],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "choice", error: "INVALID_VALUE" }]);
  });

  it("should return null for passing single-rule on choice field ", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.choice,
        rules: () => [x => (x === "A" ? "INVALID_VALUE" : null)],
      }),
    ]);
    const getValue = () => "C" as any;

    const validation = await validate({
      fields: [Schema.choice],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "choice", error: null }]);
  });

  it("should return ERR for failing single-rule on date field ", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.date,
        rules: () => [x => (x === null ? "REQUIRED" : null)],
      }),
    ]);
    const getValue = () => null as any;

    const validation = await validate({
      fields: [Schema.date],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "date", error: "REQUIRED" }]);
  });

  it("should return ERR for failing multiple-rule on string array field ", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.arrayString,
        rules: () => [
          x => (x.length > 3 ? null : "TOO_SHORT"),
          x => (x.some(y => y === "invalid") ? "INVALID_VALUE" : null),
        ],
      }),
    ]);
    const getValue = () => ["ok", "very-ok", "invalid", "still-ok"] as any;

    const validation = await validate({
      fields: [Schema.arrayString],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "arrayString", error: "INVALID_VALUE" },
    ]);
  });

  it("should return null for passing single-rule on string array array field ", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.arrayArrayString,
        rules: () => [x => (x.length > 3 ? null : "TOO_SHORT")],
      }),
    ]);
    const getValue = () =>
      [["ok"], ["very-ok"], ["invalid"], ["still-ok"]] as any;

    const validation = await validate({
      fields: [Schema.arrayArrayString],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "arrayArrayString", error: null }]);
  });

  it("should return ERR for failing async single-rule on object field ", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.object,
        rules: () => [() => wait("INVALID_VALUE")],
      }),
    ]);
    const getValue = () => null as any;

    const validation = await validate({
      fields: [Schema.object],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "object", error: "INVALID_VALUE" }]);
  });

  it("should return ERR for failing async multi-rule on object field ", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.object,
        rules: () => [() => wait(null), () => wait("REQUIRED")],
      }),
    ]);
    const getValue = () => null as any;

    const validation = await validate({
      fields: [Schema.object],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "object", error: "REQUIRED" }]);
  });

  it("should return null for passing async multi-rule on object field ", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.object,
        rules: () => [() => wait(null), () => wait(null)],
      }),
    ]);
    const getValue = () => null as any;

    const validation = await validate({
      fields: [Schema.object],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "object", error: null }]);
  });

  it("validate.every() should run for each element of list", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.arrayObjectString.every(),
        rules: () => [
          x => wait(x.str === "invalid" ? "INVALID_VALUE" : null),
          x => (x.str === "" ? "REQUIRED" : null),
          x => wait(x.str?.length < 3 ? "TOO_SHORT" : null),
        ],
      }),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "arrayObjectString[0]":
          return { str: "sm" };
        case "arrayObjectString[1]":
          return { str: "" };
        case "arrayObjectString[2]":
          return { str: "valid string" };
        case "arrayObjectString[3]":
          return { str: "invalid" };
      }
    };

    const validation = await validate({
      fields: [
        Schema.arrayObjectString.nth(0),
        Schema.arrayObjectString.nth(1),
        Schema.arrayObjectString.nth(2),
        Schema.arrayObjectString.nth(3),
      ],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "arrayObjectString[0]", error: "TOO_SHORT" },
      { path: "arrayObjectString[1]", error: "REQUIRED" },
      { path: "arrayObjectString[2]", error: null },
      { path: "arrayObjectString[3]", error: "INVALID_VALUE" },
    ]);
  });

  it("validate.every() for multiple arrays should run for each element of corresponding list", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.arrayObjectString.every(),
        rules: () => [x => wait(x.str?.length < 3 ? "TOO_SHORT" : null)],
      }),
      validate({
        field: Schema.arrayChoice.every(),
        rules: () => [x => wait(x === "c" ? "INVALID_VALUE" : null)],
      }),
    ]);
    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "arrayObjectString[0]":
          return { str: "ok-string" };
        case "arrayObjectString[1]":
          return { str: "" };

        case "arrayChoice[0]":
          return "c";
        case "arrayChoice[1]":
          return "a";
      }
    };

    const validation = await validate({
      fields: [
        Schema.arrayChoice.nth(1),
        Schema.arrayChoice.nth(0),
        Schema.arrayObjectString.nth(0),
        Schema.arrayObjectString.nth(1),
      ],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "arrayChoice[1]", error: null },
      { path: "arrayChoice[0]", error: "INVALID_VALUE" },
      { path: "arrayObjectString[0]", error: null },
      { path: "arrayObjectString[1]", error: "TOO_SHORT" },
    ]);
  });

  it("validation should run depending if corresponding trigger is present in builder", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [x => (x ? null : "REQUIRED")],
        triggers: ["blur", "submit"],
      }),
      validate({
        field: Schema.choice,
        rules: () => [x => (x ? null : "REQUIRED")],
        triggers: ["change", "submit"],
      }),
    ]);
    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "string":
          return "";
        case "choice":
          return "";
      }
    };

    const validation = await validate({
      fields: [Schema.string, Schema.choice],
      getValue,
      trigger: "change",
    }).runPromise();

    expect(validation).toEqual([{ path: "choice", error: "REQUIRED" }]);
  });

  it("validation is not making redundant calls", async () => {
    const stringRequired = jest.fn((x: string) => (x ? null : "REQUIRED"));
    const stringLength = jest.fn((x: string) =>
      x.length < 3 ? "TOO_SHORT" : null
    );
    const numberRequired = jest.fn((x: number | "") =>
      wait(x ? null : "REQUIRED")
    );
    const numberValue = jest.fn((x: number | "") =>
      wait(x < 18 ? "TOO_SHORT" : null)
    );

    const choiceCheck = jest.fn((x: "A" | "B" | "C") =>
      x === "C" ? "INVALID_VALUE" : null
    );

    const arrayCheck = jest.fn((x: string[]) =>
      x === [] ? "TOO_SHORT" : null
    );

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequired, stringLength],
        triggers: ["blur", "submit", "change"],
      }),
      validate({
        field: Schema.number,
        rules: () => [numberRequired, numberValue],
        triggers: ["change", "submit"],
      }),
      validate({
        field: Schema.choice,
        rules: () => [choiceCheck],
        triggers: ["submit"],
      }),
      validate({
        field: Schema.arrayString,
        rules: () => [arrayCheck],
        triggers: ["submit", "change", "blur"],
      }),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "string":
          return "ab";
        case "number":
          return "";
        case "choice":
          return "A";
        case "arrayString":
          return [];
      }
    };

    const validation = await validate({
      fields: [Schema.string, Schema.number, Schema.choice],
      getValue,
      trigger: "change",
    }).runPromise();

    expect(validation).toEqual([
      { path: "string", error: "TOO_SHORT" },
      { path: "number", error: "REQUIRED" },
    ]);

    expect(stringRequired).toHaveBeenCalledTimes(1);
    expect(stringLength).toHaveBeenCalledTimes(1);

    expect(numberRequired).toHaveBeenCalledTimes(1);
    // previous rule exited with error
    expect(numberValue).not.toHaveBeenCalled();

    // change trigger not included in builder
    expect(choiceCheck).not.toHaveBeenCalled();

    // arrayString was not passed for validation
    expect(arrayCheck).not.toHaveBeenCalled();
  });

  it("worked when passed multiple validators for same field", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [x => (x === "" ? "INVALID_VALUE" : null)],
      }),
      validate({
        field: Schema.string,
        rules: () => [x => (x.length < 3 ? "TOO_SHORT" : null)],
      }),
      validate({
        field: Schema.arrayString.every(),
        rules: () => [x => wait(x.length < 3 ? "TOO_SHORT" : null)],
      }),
      validate({
        field: Schema.arrayString.nth(0),
        rules: () => [x => wait(x === "invalid" ? "INVALID_VALUE" : null)],
      }),
    ]);
    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "arrayString[0]":
          return "invalid";
        case "arrayString[1]":
          return "invalid";
        case "arrayString[2]":
          return "";
        case "string":
          return "ab";
      }
    };

    const result = await validate({
      fields: [
        Schema.arrayString.nth(0),
        Schema.arrayString.nth(1),
        Schema.arrayString.nth(2),
        Schema.string,
      ],
      getValue,
    }).runPromise();

    expect(result).toEqual([
      { path: "arrayString[0]", error: "INVALID_VALUE" },
      { path: "arrayString[1]", error: null },
      { path: "arrayString[2]", error: "TOO_SHORT" },
      { path: "string", error: "TOO_SHORT" },
    ]);
  });

  it("calls callback functions to signal start and end of validation for every affected field", async () => {
    const pass = <T>(_val: T) => wait(null);

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [pass],
      }),
      validate({
        field: Schema.string,
        rules: () => [pass],
      }),
      validate({
        field: Schema.arrayString.every(),
        rules: () => [pass],
      }),
      validate({
        field: Schema.arrayString.nth(0),
        rules: () => [pass],
      }),
    ]);

    const onFieldValidationStart = jest.fn();
    const onFieldValidationEnd = jest.fn();

    const fields = [
      Schema.number,
      Schema.arrayString.nth(0),
      Schema.arrayString.nth(1),
      Schema.arrayString.nth(2),
      Schema.string,
    ];

    await validate({
      fields,
      getValue: () => "foo" as any,
      onFieldValidationStart,
      onFieldValidationEnd,
    }).runPromise();

    expect(onFieldValidationStart).toHaveBeenCalledWith("arrayString[0]");
    expect(onFieldValidationStart).toHaveBeenCalledWith("arrayString[1]");
    expect(onFieldValidationStart).toHaveBeenCalledWith("arrayString[2]");
    expect(onFieldValidationStart).toHaveBeenCalledWith("string");
    expect(onFieldValidationStart).not.toHaveBeenCalledWith("number");
    expect(onFieldValidationStart).not.toHaveBeenCalledWith("arrayString");

    expect(onFieldValidationEnd).toHaveBeenCalledWith("arrayString[0]");
    expect(onFieldValidationEnd).toHaveBeenCalledWith("arrayString[1]");
    expect(onFieldValidationEnd).toHaveBeenCalledWith("arrayString[2]");
    expect(onFieldValidationEnd).toHaveBeenCalledWith("string");
    expect(onFieldValidationEnd).not.toHaveBeenCalledWith("number");
    expect(onFieldValidationEnd).not.toHaveBeenCalledWith("arrayString");
  });

  it("should cancel validation when optional rule is used", async () => {
    const rule1 = jest.fn().mockReturnValue("ERR_1");
    const rule2 = jest.fn().mockReturnValue("ERR_2");

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [validators.optional(), rule1, rule2],
      }),
    ]);

    const getValue = jest
      .fn()
      .mockReturnValueOnce("")
      .mockReturnValueOnce("foo");

    {
      const result = await validate({
        fields: [Schema.string],
        getValue,
      }).runPromise();

      expect(result).toEqual([{ path: "string", error: null }]);
      expect(rule1).not.toHaveBeenCalled();
      expect(rule2).not.toHaveBeenCalled();
    }

    {
      const result = await validate({
        fields: [Schema.string],
        getValue,
      }).runPromise();

      expect(result).toEqual([{ path: "string", error: "ERR_1" }]);
      expect(rule1).toHaveBeenCalled();
      expect(rule2).not.toHaveBeenCalled();
    }
  });

  it("should re-throw any errors thrown by validation rules", async () => {
    const error = new Error("test error");

    const rule1 = jest.fn().mockReturnValue(null);
    const rule2 = jest.fn().mockRejectedValue(error);

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [rule1, rule2],
      }),
    ]);

    const getValue = jest.fn().mockReturnValue("foo");

    await expect(() =>
      validate({ fields: [Schema.string], getValue }).runPromise()
    ).rejects.toBe(error);
  });

  it("array validation should fire validation for each field", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.arrayObjectString,
        rules: () => [x => (x.length < 3 ? "TOO_SHORT" : null)],
      }),
      validate({
        field: Schema.arrayObjectString.every(),
        rules: () => [x => (x.str === "" ? "REQUIRED" : null)],
      }),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "arrayObjectString":
          return [{ str: "ok-string" }, { str: "" }];
        case "arrayObjectString[0]":
          return { str: "ok-string" };
        case "arrayObjectString[1]":
          return { str: "" };
      }
    };

    const validation = await validate({
      fields: [Schema.arrayObjectString],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "arrayObjectString", error: "TOO_SHORT" },
      { path: "arrayObjectString[0]", error: null },
      { path: "arrayObjectString[1]", error: "REQUIRED" },
    ]);
  });

  it("object validation should fire validation for each child", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.object.num,
        rules: () => [x => (x > 0 ? null : "REQUIRED")],
      }),
      validate({
        field: Schema.object.str,
        rules: () => [x => (x ? null : "REQUIRED")],
      }),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "object":
          return { str: "", num: 10 };
        case "object.str":
          return "";
        case "object.num":
          return 10;
      }
    };

    const validation = await validate({
      fields: [Schema.object],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "object.str", error: "REQUIRED" },
      { path: "object.num", error: null },
    ]);
  });

  it("nested object validation should fire validation for each child without duplicates", async () => {
    const arrayValidator = jest.fn(x => (x.length > 1 ? null : "TOO_SHORT"));
    const arrayItemValidator = jest.fn(x => (x ? null : "REQUIRED"));
    const stringValidator = jest.fn(x =>
      x === "no-ok" ? "INVALID_VALUE" : null
    );

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.objectObjectArrayObjectString.obj.array,
        rules: () => [arrayValidator],
      }),
      validate({
        field: Schema.objectObjectArrayObjectString.obj.array.every(),
        rules: () => [arrayItemValidator],
      }),
      validate({
        field: Schema.objectObjectArrayObjectString.obj.array.nth(1).str,
        rules: () => [stringValidator],
      }),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "objectObjectArrayObjectString.obj.array":
          return [{ str: "" }, { str: "no-ok" }];
        case "objectObjectArrayObjectString.obj.array[0]":
          return { str: "" };
        case "objectObjectArrayObjectString.obj.array[1]":
          return { str: "no-ok" };
        case "objectObjectArrayObjectString.obj.array[1].str":
          return "no-ok";
      }
    };

    const validation = await validate({
      fields: [
        Schema.objectObjectArrayObjectString,
        Schema.objectObjectArrayObjectString.obj.array.nth(0),
      ],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "objectObjectArrayObjectString.obj.array", error: null },
      {
        path: "objectObjectArrayObjectString.obj.array[0]",
        error: null,
      },
      {
        path: "objectObjectArrayObjectString.obj.array[1]",
        error: null,
      },
      {
        path: "objectObjectArrayObjectString.obj.array[1].str",
        error: "INVALID_VALUE",
      },
    ]);

    expect(arrayValidator).toHaveBeenCalledTimes(1);
    expect(arrayItemValidator).toHaveBeenCalledTimes(2);
    expect(stringValidator).toHaveBeenCalledTimes(1);
  });

  it("should work with simple signature", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate(Schema.string, x => (x ? null : "REQUIRED")),
    ]);

    const getValue = () => "" as any;

    const validation = await validate({
      fields: [Schema.string],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "string", error: "REQUIRED" }]);
  });

  it("should work with simple signature with array.every()", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate(
        Schema.arrayObjectString.every(),
        x => wait(x.str === "invalid" ? "INVALID_VALUE" : null),
        x => (x.str === "" ? "REQUIRED" : null),
        x => wait(x.str?.length < 3 ? "TOO_SHORT" : null)
      ),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "arrayObjectString[0]":
          return { str: "sm" };
        case "arrayObjectString[1]":
          return { str: "" };
        case "arrayObjectString[2]":
          return { str: "valid string" };
        case "arrayObjectString[3]":
          return { str: "invalid" };
      }
    };

    const validation = await validate({
      fields: [
        Schema.arrayObjectString.nth(0),
        Schema.arrayObjectString.nth(1),
        Schema.arrayObjectString.nth(2),
        Schema.arrayObjectString.nth(3),
      ],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "arrayObjectString[0]", error: "TOO_SHORT" },
      { path: "arrayObjectString[1]", error: "REQUIRED" },
      { path: "arrayObjectString[2]", error: null },
      { path: "arrayObjectString[3]", error: "INVALID_VALUE" },
    ]);
  });

  it("dependency change should trigger validation run", async () => {
    const required = (x: any) => (x ? null : "REQUIRED");

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: _number => [required],
        dependencies: [Schema.number],
      }),
      validate({
        field: Schema.number,
        rules: () => [required],
      }),
    ]);

    const getValue = () => "" as any;

    const validation = await validate({
      fields: [Schema.number],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "number", error: "REQUIRED" },
      { path: "string", error: "REQUIRED" },
    ]);
  });

  it("dependency change should trigger validation run for with array.every()", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.arrayObjectString.every(),
        rules: _ => [x => (x.str === "" ? "REQUIRED" : null)],
        dependencies: [Schema.choice],
      }),
      validate(Schema.choice, x => (x === "A" ? "INVALID_VALUE" : null)),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "arrayObjectString":
          return [{ str: "sm" }, { str: "" }, { str: "valid string" }];
        case "arrayObjectString[0]":
          return { str: "sm" };
        case "arrayObjectString[1]":
          return { str: "" };
        case "arrayObjectString[2]":
          return { str: "valid string" };
        case "choice":
          return "A";
      }
    };

    const validation = await validate({
      fields: [Schema.choice],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "choice", error: "INVALID_VALUE" },
      { path: "arrayObjectString[0]", error: null },
      { path: "arrayObjectString[1]", error: "REQUIRED" },
      { path: "arrayObjectString[2]", error: null },
    ]);
  });

  it("dependency change should trigger validation run for with array.every()...", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.arrayObjectString.every().str,
        rules: _ => [x => (x === "" ? "REQUIRED" : null)],
        dependencies: [Schema.choice],
      }),
      validate(Schema.choice, x => (x === "A" ? "INVALID_VALUE" : null)),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "arrayObjectString":
          return [{ str: "sm" }, { str: "" }, { str: "valid string" }];
        case "arrayObjectString[0].str":
          return "sm";
        case "arrayObjectString[1].str":
          return "";
        case "arrayObjectString[2].str":
          return "valid string";
        case "choice":
          return "A";
      }
    };

    const validation = await validate({
      fields: [Schema.choice],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "choice", error: "INVALID_VALUE" },
      { path: "arrayObjectString[0].str", error: null },
      { path: "arrayObjectString[1].str", error: "REQUIRED" },
      { path: "arrayObjectString[2].str", error: null },
    ]);
  });

  it("dependency change should not duplicate validation", async () => {
    const required = (x: any) => (x ? null : "REQUIRED");

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: _number => [required],
        dependencies: [Schema.number],
      }),
      validate({
        field: Schema.number,
        rules: () => [required],
      }),
    ]);

    const getValue = () => "" as any;

    const validation = await validate({
      fields: [Schema.number, Schema.string],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "number", error: "REQUIRED" },
      { path: "string", error: "REQUIRED" },
    ]);
  });

  it("dependency change should trigger validation run even if root field triggers don't match", async () => {
    const required = (x: any) => (x ? null : "REQUIRED");

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: _number => [required],
        dependencies: [Schema.number],
      }),
      validate({
        field: Schema.choice,
        rules: _number => [required],
        dependencies: [Schema.number],
        triggers: ["blur"],
      }),
      validate({
        field: Schema.number,
        rules: () => [required],
        triggers: ["blur"],
      }),
    ]);

    const getValue = () => "" as any;

    const validation = await validate({
      fields: [Schema.number],
      getValue,
      trigger: "change",
    }).runPromise();

    expect(validation).toEqual([{ path: "string", error: "REQUIRED" }]);
  });

  it("dependencies values are passed to rules constructor", async () => {
    const rules = jest.fn((...dependencies) => [
      () =>
        dependencies[0] === 2 &&
        dependencies[1] === "B" &&
        dependencies[2].length === 0
          ? null
          : "INVALID_VALUE",
    ]) as any;

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules,
        dependencies: [Schema.number, Schema.choice, Schema.arrayChoice],
      }),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "string":
          return "string";
        case "number":
          return 2;
        case "choice":
          return "B";
        case "arrayChoice":
          return [];
      }
    };

    const validation = await validate({
      fields: [Schema.string],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "string", error: null }]);
    expect(rules).toHaveBeenCalledWith(2, "B", []);
  });

  it("is no dependencies are provided empty list should be passed to rules constructor", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: (...dependencies) => [
          () => (dependencies.length === 0 ? null : "INVALID_VALUE"),
        ],
      }),
    ]);

    const getValue = (_field: FieldDescriptor<any> | string): any => "" as any;

    const validation = await validate({
      fields: [Schema.string],
      getValue,
    }).runPromise();

    expect(validation).toEqual([{ path: "string", error: null }]);
  });

  it("should trigger parent validation when child is validating", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.objectArray.arrayString.every(),
        rules: () => [x => (x === "" ? "INVALID_VALUE" : null)],
      }),
      validate({
        field: Schema.objectArray.arrayString,
        rules: () => [x => (x.length < 2 ? "TOO_SHORT" : null)],
      }),
      validate({
        field: Schema.objectArray,
        rules: () => [x => (x.arrayString.length < 2 ? "TOO_SHORT" : null)],
      }),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "objectArray":
          return { arrayString: [""] };
        case "objectArray.arrayString":
          return [""];
        case "objectArray.arrayString[0]":
          return "";
      }
    };

    const validation = await validate({
      fields: [Schema.objectArray.arrayString.nth(0)],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "objectArray.arrayString[0]", error: "INVALID_VALUE" },
      { path: "objectArray.arrayString", error: "TOO_SHORT" },
      { path: "objectArray", error: "TOO_SHORT" },
    ]);
  });

  it("should trigger parent validation when child is validating and not trigger another parents branches", async () => {
    const stringValidator = jest.fn((x: string) =>
      x === "" ? "INVALID_VALUE" : null
    );
    const numberValidator = jest.fn((x: number | "") =>
      x === "" ? "INVALID_VALUE" : null
    );

    const arrayNumberValidator = jest.fn((_: number[]) => null);

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.objectTwoArrays.arrayString.every(),
        rules: () => [stringValidator],
      }),
      validate({
        field: Schema.objectTwoArrays.arrayNumber.every(),
        rules: () => [numberValidator],
      }),
      validate({
        field: Schema.objectTwoArrays.arrayString,
        rules: () => [x => (x.length < 2 ? "TOO_SHORT" : null)],
      }),
      validate({
        field: Schema.objectTwoArrays.arrayNumber,
        rules: () => [arrayNumberValidator],
      }),
      validate({
        field: Schema.objectTwoArrays,
        rules: () => [x => (x.arrayString.length < 2 ? "TOO_SHORT" : null)],
      }),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "objectTwoArrays":
          return { arrayString: [""], arrayNumber: [1] };
        case "objectTwoArrays.arrayString":
          return [""];
        case "objectTwoArrays.arrayNumber":
          return [1];
        case "objectTwoArrays.arrayString[0]":
          return "";
        case "objectTwoArrays.arrayNumber[0]":
          return 1;
      }
    };

    const validation = await validate({
      fields: [Schema.objectTwoArrays.arrayString.nth(0)],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      {
        path: "objectTwoArrays.arrayString[0]",
        error: "INVALID_VALUE",
      },
      { path: "objectTwoArrays.arrayString", error: "TOO_SHORT" },
      { path: "objectTwoArrays", error: "TOO_SHORT" },
    ]);
    expect(stringValidator).toBeCalledTimes(1);
    expect(numberValidator).not.toHaveBeenCalled();
    expect(arrayNumberValidator).not.toHaveBeenCalled();
  });

  it("should work with array.every()...", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate(Schema.arrayObjectString.every().str, x =>
        wait(x === "invalid" ? "INVALID_VALUE" : null)
      ),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "arrayObjectString[0].str":
          return "";
        case "arrayObjectString[1].str":
          return "invalid";
        case "arrayObjectString[2].str":
          return "valid";
      }
    };

    const validation = await validate({
      fields: [
        Schema.arrayObjectString.nth(0).str,
        Schema.arrayObjectString.nth(1).str,
        Schema.arrayObjectString.nth(2).str,
      ],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "arrayObjectString[0].str", error: null },
      { path: "arrayObjectString[1].str", error: "INVALID_VALUE" },
      { path: "arrayObjectString[2].str", error: null },
    ]);
  });

  it("should work with array.every().every()", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate(Schema.arrayArrayString.every().every(), x =>
        wait(x === "invalid" ? "INVALID_VALUE" : null)
      ),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "arrayArrayString[0][0]":
          return "";
        case "arrayArrayString[0][1]":
          return "invalid";
        case "arrayArrayString[1][0]":
          return "valid";
      }
    };

    const validation = await validate({
      fields: [
        Schema.arrayArrayString.nth(0).nth(0),
        Schema.arrayArrayString.nth(0).nth(1),
        Schema.arrayArrayString.nth(1).nth(0),
      ],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "arrayArrayString[0][0]", error: null },
      { path: "arrayArrayString[0][1]", error: "INVALID_VALUE" },
      { path: "arrayArrayString[1][0]", error: null },
    ]);
  });

  it("should work with array.every()...every()", async () => {
    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate(Schema.arrayNestedArrays.every().array.every(), x =>
        wait(x === "invalid" ? "INVALID_VALUE" : null)
      ),
    ]);

    const getValue = (field: FieldDescriptor<any> | string): any => {
      const path = typeof field === "string" ? field : impl(field).__path;
      switch (path) {
        case "arrayNestedArrays[0].array[0]":
          return "";
        case "arrayNestedArrays[0].array[1]":
          return "invalid";
        case "arrayNestedArrays[1].array[0]":
          return "valid";
      }
    };

    const validation = await validate({
      fields: [
        Schema.arrayNestedArrays.nth(0).array.nth(0),
        Schema.arrayNestedArrays.nth(0).array.nth(1),
        Schema.arrayNestedArrays.nth(1).array.nth(0),
      ],
      getValue,
    }).runPromise();

    expect(validation).toEqual([
      { path: "arrayNestedArrays[0].array[0]", error: null },
      {
        path: "arrayNestedArrays[0].array[1]",
        error: "INVALID_VALUE",
      },
      { path: "arrayNestedArrays[1].array[0]", error: null },
    ]);
  });

  it("should not accept templates as dependencies", async () => {
    createFormValidatorImpl(Schema, validate => [
      //@ts-expect-error
      validate({
        field: Schema.string,
        dependencies: [Schema.arrayString.every()],
        rules: _template => [],
      }),
    ]);
  });
});

describe("debounced validation", () => {
  const Schema = new FormSchemaBuilder()
    .fields({
      string: FormFields.string(),
      number: FormFields.number(),
    })
    .errors<"REQUIRED" | "TOO_SHORT" | "INVALID_VALUE">()
    .build();

  const createFormValidatorImpl = (
    ...args: Parameters<typeof createFormValidator>
  ) => impl(createFormValidator(...args));

  it("should debounce when single-rule debounced validator called >1 times", async () => {
    const stringRequiredValidator = jest.fn((x: string) =>
      x ? null : "REQUIRED"
    );

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator],
        debounce: 100,
      }),
    ]);

    const getValue = () => "" as any;

    expect(
      await Task.all(
        validate({ fields: [Schema.string], getValue }),
        validate({ fields: [Schema.string], getValue }),
        validate({ fields: [Schema.string], getValue })
      ).runPromise()
    ).toEqual([[], [], [{ path: "string", error: "REQUIRED" }]]);
    expect(stringRequiredValidator).toHaveBeenCalledTimes(1);
  });

  it("should debounce when multi-rule debounced validator called >1 times", async () => {
    const stringRequiredValidator = jest.fn((x: string) =>
      x ? null : "REQUIRED"
    );
    const stringLengthValidator = jest.fn((x: string) =>
      x.length > 3 ? null : "TOO_SHORT"
    );

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator, stringLengthValidator],
        debounce: 100,
      }),
    ]);

    const getValue = () => "ab" as any;

    expect(
      await Task.all(
        validate({ fields: [Schema.string], getValue }),
        validate({ fields: [Schema.string], getValue }),
        validate({ fields: [Schema.string], getValue })
      ).runPromise()
    ).toEqual([[], [], [{ path: "string", error: "TOO_SHORT" }]]);
    expect(stringRequiredValidator).toHaveBeenCalledTimes(1);
    expect(stringLengthValidator).toHaveBeenCalledTimes(1);
  });

  it("should not debounce when called after debounce timeout", async () => {
    const stringRequiredValidator = jest.fn((x: string) =>
      x ? null : "REQUIRED"
    );

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator],
        debounce: 100,
      }),
    ]);

    const getValue = () => "ab" as any;

    expect(
      await Task.all(
        validate({ fields: [Schema.string], getValue }),
        Task.make(({ resolve, reject }) => {
          setTimeout(
            () =>
              validate({ fields: [Schema.string], getValue })
                .runPromise()
                .then(resolve)
                .catch(reject),
            200
          );
        })
      ).runPromise()
    ).toEqual([
      [{ path: "string", error: null }],
      [{ path: "string", error: null }],
    ]);

    expect(stringRequiredValidator).toHaveBeenCalledTimes(2);
  });

  it("should not interfere with non-debounced fields", async () => {
    const stringRequiredValidator = jest.fn((x: string) =>
      x ? null : "REQUIRED"
    );
    const numberLengthValidator = jest.fn((x: number | "") =>
      x ? null : "REQUIRED"
    );

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator],
        debounce: 100,
      }),
      validate(Schema.number, numberLengthValidator),
    ]);

    const getValue = () => "" as any;

    expect(
      await Task.all(
        validate({ fields: [Schema.string], getValue }),
        validate({ fields: [Schema.number], getValue }),
        validate({ fields: [Schema.string], getValue }),
        validate({ fields: [Schema.number], getValue })
      ).runPromise()
    ).toEqual([
      [],
      [{ path: "number", error: "REQUIRED" }],
      [{ path: "string", error: "REQUIRED" }],
      [{ path: "number", error: "REQUIRED" }],
    ]);

    expect(stringRequiredValidator).toHaveBeenCalledTimes(1);
    expect(numberLengthValidator).toHaveBeenCalledTimes(2);
  });

  it("should properly debounce multiple debounced validators for the same field", async () => {
    const stringRequiredValidator = jest.fn((x: string) =>
      x ? null : "REQUIRED"
    );
    const stringLengthValidator = jest.fn((x: string) =>
      x.length > 3 ? null : "TOO_SHORT"
    );

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator],
        debounce: 100,
      }),
      validate({
        field: Schema.string,
        rules: () => [stringLengthValidator],
        debounce: 100,
      }),
    ]);

    const getValue = () => "ab" as any;

    expect(
      await Task.all(
        validate({ fields: [Schema.string], getValue }),
        validate({ fields: [Schema.string], getValue }),
        validate({ fields: [Schema.string], getValue })
      ).runPromise()
    ).toEqual([[], [], [{ path: "string", error: "TOO_SHORT" }]]);

    expect(stringRequiredValidator).toHaveBeenCalledTimes(1);
    expect(stringLengthValidator).toHaveBeenCalledTimes(1);
  });

  it("should properly debounce multiple debounced and non-debounced validators for the same field", async () => {
    const stringRequiredValidator = jest.fn((x: string) =>
      x ? null : "REQUIRED"
    );
    const stringLengthValidator = jest.fn((x: string) =>
      x.length > 3 ? null : "TOO_SHORT"
    );
    const stringValueValidator = jest.fn((x: string) =>
      x === "value" ? null : "INVALID_VALUE"
    );

    const { validate } = createFormValidatorImpl(Schema, validate => [
      validate({
        field: Schema.string,
        rules: () => [stringRequiredValidator],
        debounce: 100,
      }),
      validate(Schema.string, stringValueValidator),
      validate({
        field: Schema.string,
        rules: () => [stringLengthValidator],
        debounce: 100,
      }),
    ]);

    const getValue = () => "not-value" as any;

    expect(
      await Task.all(
        validate({ fields: [Schema.string], getValue }),
        validate({ fields: [Schema.string], getValue }),
        validate({ fields: [Schema.string], getValue })
      ).runPromise()
    ).toEqual([[], [], [{ path: "string", error: "INVALID_VALUE" }]]);

    expect(stringRequiredValidator).toHaveBeenCalledTimes(1);
    expect(stringValueValidator).toHaveBeenCalledTimes(1);
    expect(stringLengthValidator).toHaveBeenCalledTimes(0);
  });
});
