import { assert, IsExact } from "conditional-type-checks";

import { GenericFieldDescriptor } from "./field-descriptor";
import { FieldValidator, ValidateFn } from "./form-validator";

const validator: ValidateFn = (() => {}) as any;

describe("validateFn", () => {
  type Err = { code: "err1" | "err2" };
  const fd1: GenericFieldDescriptor<string, Err> = {} as any;
  const fd2: GenericFieldDescriptor<number, Err> = {} as any;
  const fd3: GenericFieldDescriptor<"a" | "b" | "c", Err> = {} as any;
  const fd4: GenericFieldDescriptor<Date[], Err> = { every: () => {} } as any;
  const fd5: GenericFieldDescriptor<
    { parent: { child: string[] } },
    Err
  > = {} as any;

  it("resolves properly for string", () => {
    const stringFieldValidator = validator({
      field: fd1,
      dependencies: [fd2, fd3],
      rules: (_number, _choice) => [false],
    });

    type Actual = typeof stringFieldValidator;
    type Expected = FieldValidator<string, Err, [number, "a" | "b" | "c"]>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for choice", () => {
    const choiceFieldValidator = validator({
      field: fd3,
      dependencies: [fd1, fd4],
      rules: (_string, _dateArray) => [false],
    });

    type Actual = typeof choiceFieldValidator;
    type Expected = FieldValidator<"a" | "b" | "c", Err, [string, Date[]]>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for array", () => {
    const arrayFieldValidator = validator({
      field: fd4,
      dependencies: [fd1, fd2, fd3, fd5],
      rules: (_string, _number, _choice, _obj) => [false],
    });

    type Actual = typeof arrayFieldValidator;
    type Expected = FieldValidator<
      Date[],
      Err,
      [string, number, "a" | "b" | "c", { parent: { child: string[] } }]
    >;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for array nth", () => {
    const arrayFieldValidator = validator({
      field: fd4.every(),
      dependencies: [fd1, fd2, fd3, fd5],
      rules: (_string, _number, _choice, _obj) => [false],
    });

    type Actual = typeof arrayFieldValidator;
    type Expected = FieldValidator<
      Date,
      Err,
      [string, number, "a" | "b" | "c", { parent: { child: string[] } }]
    >;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for object array", () => {
    const objFieldValidator = validator({
      field: fd5,
      dependencies: [fd1],
      rules: _string => [false],
    });

    type Actual = typeof objFieldValidator;
    type Expected = FieldValidator<
      { parent: { child: string[] } },
      Err,
      [string]
    >;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly with no dependencies", () => {
    const fieldValidator = validator({
      field: fd1,
      rules: () => [null],
    });

    type Actual = typeof fieldValidator;
    type Expected = FieldValidator<string, Err, []>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for simple signature", () => {
    const stringFieldValidator = validator(fd1, () => null);

    type Actual = typeof stringFieldValidator;
    type Expected = FieldValidator<string, Err, []>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for simple signature for array", () => {
    const stringFieldValidator = validator(fd4, () => null);

    type Actual = typeof stringFieldValidator;
    type Expected = FieldValidator<Date[], Err, []>;

    assert<IsExact<Actual, Expected>>(true);
  });

  it("resolves properly for simple signature for array.nth", () => {
    const stringFieldValidator = validator(fd4.every(), () => null);

    type Actual = typeof stringFieldValidator;
    type Expected = FieldValidator<Date, Err, []>;

    assert<IsExact<Actual, Expected>>(true);
  });
});
