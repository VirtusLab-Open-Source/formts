import { assert, IsExact } from "conditional-type-checks";

import { FormFields, FormSchemaBuilder } from "../schema";

import { FieldValidator, createFieldValidator } from "./field-validator";

type Err = "err1" | "err2";

const Schema = new FormSchemaBuilder()
  .fields({
    string: FormFields.string(),
    number: FormFields.number(),
    choice: FormFields.choice("a", "b", "c"),
    dateArray: FormFields.array(FormFields.date()),
    object: FormFields.object({
      nested: FormFields.object({
        array: FormFields.array(FormFields.string()),
      }),
    }),
  })
  .errors<Err>()
  .build();

describe("CreateFieldValidatorFn type", () => {
  it("resolves properly for string", () => {
    const stringFieldValidator = createFieldValidator({
      field: Schema.string,
      dependencies: [Schema.number, Schema.choice],
      rules: (_number, _choice) => [false],
    });

    type Actual = typeof stringFieldValidator;
    type Expected = FieldValidator<string, Err, [number | "", "a" | "b" | "c"]>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for choice", () => {
    const choiceFieldValidator = createFieldValidator({
      field: Schema.choice,
      dependencies: [Schema.string, Schema.dateArray],
      rules: (_string, _dateArray) => [false],
    });

    type Actual = typeof choiceFieldValidator;
    type Expected = FieldValidator<
      "a" | "b" | "c",
      Err,
      [string, Array<Date | null>]
    >;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for array", () => {
    const arrayFieldValidator = createFieldValidator({
      field: Schema.dateArray,
      dependencies: [
        Schema.string,
        Schema.number,
        Schema.choice,
        Schema.object,
      ],
      rules: (_string, _number, _choice, _obj) => [false],
    });

    type Actual = typeof arrayFieldValidator;
    type Expected = FieldValidator<
      Array<Date | null>,
      Err,
      [string, number | "", "a" | "b" | "c", { nested: { array: string[] } }]
    >;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for array nth", () => {
    const arrayFieldValidator = createFieldValidator({
      field: Schema.dateArray.every(),
      dependencies: [
        Schema.string,
        Schema.number,
        Schema.choice,
        Schema.object,
      ],
      rules: (_string, _number, _choice, _obj) => [false],
    });

    type Actual = typeof arrayFieldValidator;
    type Expected = FieldValidator<
      Date | null,
      Err,
      [string, number | "", "a" | "b" | "c", { nested: { array: string[] } }]
    >;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for object", () => {
    const objFieldValidator = createFieldValidator({
      field: Schema.object,
      dependencies: [Schema.string],
      rules: _string => [false],
    });

    type Actual = typeof objFieldValidator;
    type Expected = FieldValidator<
      { nested: { array: string[] } },
      Err,
      [string]
    >;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly with no dependencies", () => {
    const fieldValidator = createFieldValidator({
      field: Schema.string,
      rules: () => [null],
    });

    type Actual = typeof fieldValidator;
    type Expected = FieldValidator<string, Err, []>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for simple signature", () => {
    const stringFieldValidator = createFieldValidator(
      Schema.string,
      () => null
    );

    type Actual = typeof stringFieldValidator;
    type Expected = FieldValidator<string, Err, []>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for simple signature for array", () => {
    const stringFieldValidator = createFieldValidator(
      Schema.dateArray,
      () => null
    );

    type Actual = typeof stringFieldValidator;
    type Expected = FieldValidator<Array<Date | null>, Err, []>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for simple signature for array.every", () => {
    const stringFieldValidator = createFieldValidator(
      Schema.dateArray.every(),
      () => null
    );

    type Actual = typeof stringFieldValidator;
    type Expected = FieldValidator<Date | null, Err, []>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for simple signature for array.nth", () => {
    const stringFieldValidator = createFieldValidator(
      Schema.dateArray.nth(0),
      () => null
    );

    type Actual = typeof stringFieldValidator;
    type Expected = FieldValidator<Date | null, Err, []>;

    assert<IsExact<Actual, Expected>>(true);
  });
});

describe("createFieldValidator", () => {
  it("creates FieldValidator object when invoked using simple signature", () => {
    const rule1 = jest.fn();
    const rule2 = jest.fn();

    const result = createFieldValidator(Schema.string, rule1, rule2);

    expect(result).toEqual({
      id: expect.any(String),
      path: "string",
      validators: expect.any(Function),
      regex: undefined,
      triggers: undefined,
      dependencies: undefined,
      debounce: undefined,
    });
    expect(result.validators()).toEqual([rule1, rule2]);
  });

  it("creates FieldValidator object when invoked using advanced signature", () => {
    const rule1 = jest.fn();
    const rule2 = jest.fn();

    const result = createFieldValidator({
      field: Schema.object.nested.array,
      dependencies: [Schema.number, Schema.dateArray],
      rules: (_number, _dateArray) => [rule1, rule2],
      triggers: ["blur"],
      debounce: 250,
    });

    expect(result).toEqual({
      id: expect.any(String),
      path: "object.nested.array",
      validators: expect.any(Function),
      regex: undefined,
      triggers: ["blur"],
      dependencies: [Schema.number, Schema.dateArray],
      debounce: 250,
    });
    expect(result.validators(0, [])).toEqual([rule1, rule2]);
  });

  it("creates FieldValidator object with field regex for template fields", () => {
    const rule1 = jest.fn();
    const rule2 = jest.fn();

    const result = createFieldValidator({
      field: Schema.object.nested.array.every(),
      rules: () => [rule1, rule2],
    });

    expect(result).toEqual({
      id: expect.any(String),
      path: "object.nested.array[*]",
      validators: expect.any(Function),
      regex: expect.any(RegExp),
      triggers: undefined,
      dependencies: undefined,
      debounce: undefined,
    });
    expect(result.validators()).toEqual([rule1, rule2]);
  });

  it("creates FieldValidator objects with unique ids", () => {
    const result1 = createFieldValidator(Schema.string, () => null);
    const result2 = createFieldValidator(Schema.string, () => null);
    const result3 = createFieldValidator(Schema.string, () => null);

    expect(result1.id).not.toEqual(result2.id);
    expect(result2.id).not.toEqual(result3.id);
  });
});
