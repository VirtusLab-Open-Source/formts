import { Falsy } from "../utils";

import { FieldDescriptor, FormSchema } from "./descriptors";

/**
 * Function responsible for validating single field.
 *
 * @param value - value to be validated of type `T`
 *
 * @returns validation error of type `Err`, or `null` when field is valid
 */
export type Validator<T, Err> =
  | Validator.Sync<T, Err>
  | Validator.Async<T, Err>;

export namespace Validator {
  export type Sync<T, Err> = {
    (value: T): Err | null;
  };
  export type Async<T, Err> = {
    (value: T): Promise<Err | null>;
  };
}

export type ValidationTrigger = "change" | "blur" | "submit";

export type FormValidator<Values extends object, Err> = {
  validate: (
    fields: Array<FieldDescriptor<unknown, Err>>,
    getValue: <P>(field: FieldDescriptor<P, Err>) => P,
    trigger?: ValidationTrigger
  ) => Array<{ field: FieldDescriptor<unknown, Err>; error: Err | null }>;
};

type FieldValidator<T, E, Err> = {
  type: "inner" | "outer";
  field: FieldDescriptor<T, Err>;
  validators: (...deps: unknown[]) => Array<Falsy | Validator<E, Err>>;
  triggers?: Array<ValidationTrigger>;
  dependencies?: unknown[];
};

type ValidateFn<Err> = {
  each: ValidateEachFn<Err>;

  <T>(config: {
    field: FieldDescriptor<T, Err>;
    rules: () => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies?: [];
  }): FieldValidator<T, T, Err>;

  <T, D1>(config: {
    field: FieldDescriptor<T, Err>;
    rules: (dep1: D1) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [FieldDescriptor<D1, Err>];
  }): FieldValidator<T, T, Err>;

  <T, D1, D2>(config: {
    field: FieldDescriptor<T, Err>;
    rules: (dep1: D1, dep2: D2) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [FieldDescriptor<D1, Err>, FieldDescriptor<D2, Err>];
  }): FieldValidator<T, T, Err>;

  <T, D1, D2, D3>(config: {
    field: FieldDescriptor<T, Err>;
    rules: (dep1: D1, dep2: D2, dep3: D3) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [
      FieldDescriptor<D1, Err>,
      FieldDescriptor<D2, Err>,
      FieldDescriptor<D3, Err>
    ];
  }): FieldValidator<T, T, Err>;

  <T, D1, D2, D3, D4>(config: {
    field: FieldDescriptor<T, Err>;
    rules: (
      dep1: D1,
      dep2: D2,
      dep3: D3,
      dep4: D4
    ) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [
      FieldDescriptor<D1, Err>,
      FieldDescriptor<D2, Err>,
      FieldDescriptor<D3, Err>,
      FieldDescriptor<D4, Err>
    ];
  }): FieldValidator<T, T, Err>;

  <T, D1, D2, D3, D4, D5>(config: {
    field: FieldDescriptor<T, Err>;
    rules: (
      dep1: D1,
      dep2: D2,
      dep3: D3,
      dep4: D4,
      dep5: D5
    ) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [
      FieldDescriptor<D1, Err>,
      FieldDescriptor<D2, Err>,
      FieldDescriptor<D3, Err>,
      FieldDescriptor<D4, Err>,
      FieldDescriptor<D5, Err>
    ];
  }): FieldValidator<T, T, Err>;

  <T, D1, D2, D3, D4, D5, D6>(config: {
    field: FieldDescriptor<T, Err>;
    rules: (
      dep1: D1,
      dep2: D2,
      dep3: D3,
      dep4: D4,
      dep5: D5,
      dep6: D6
    ) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [
      FieldDescriptor<D1, Err>,
      FieldDescriptor<D2, Err>,
      FieldDescriptor<D3, Err>,
      FieldDescriptor<D4, Err>,
      FieldDescriptor<D5, Err>,
      FieldDescriptor<D6, Err>
    ];
  }): FieldValidator<T, T, Err>;
};

type ValidateEachFn<Err> = {
  <T>(config: {
    field: FieldDescriptor<T[], Err>;
    rules: () => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies?: [];
  }): FieldValidator<T[], T, Err>;

  <T, D1>(config: {
    field: FieldDescriptor<T[], Err>;
    rules: (dep1: D1) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [FieldDescriptor<D1, Err>];
  }): FieldValidator<T[], T, Err>;

  <T, D1, D2>(config: {
    field: FieldDescriptor<T[], Err>;
    rules: (dep1: D1, dep2: D2) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [FieldDescriptor<D1, Err>, FieldDescriptor<D2, Err>];
  }): FieldValidator<T[], T, Err>;

  <T, D1, D2, D3>(config: {
    field: FieldDescriptor<T[], Err>;
    rules: (dep1: D1, dep2: D2, dep3: D3) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [
      FieldDescriptor<D1, Err>,
      FieldDescriptor<D2, Err>,
      FieldDescriptor<D3, Err>
    ];
  }): FieldValidator<T[], T, Err>;

  <T, D1, D2, D3, D4>(config: {
    field: FieldDescriptor<T[], Err>;
    rules: (
      dep1: D1,
      dep2: D2,
      dep3: D3,
      dep4: D4
    ) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [
      FieldDescriptor<D1, Err>,
      FieldDescriptor<D2, Err>,
      FieldDescriptor<D3, Err>,
      FieldDescriptor<D4, Err>
    ];
  }): FieldValidator<T[], T, Err>;

  <T, D1, D2, D3, D4, D5>(config: {
    field: FieldDescriptor<T[], Err>;
    rules: (
      dep1: D1,
      dep2: D2,
      dep3: D3,
      dep4: D4,
      dep5: D5
    ) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [
      FieldDescriptor<D1, Err>,
      FieldDescriptor<D2, Err>,
      FieldDescriptor<D3, Err>,
      FieldDescriptor<D4, Err>,
      FieldDescriptor<D5, Err>
    ];
  }): FieldValidator<T[], T, Err>;

  <T, D1, D2, D3, D4, D5, D6>(config: {
    field: FieldDescriptor<T[], Err>;
    rules: (
      dep1: D1,
      dep2: D2,
      dep3: D3,
      dep4: D4,
      dep5: D5,
      dep6: D6
    ) => Array<Falsy | Validator<T, Err>>;
    triggers?: ValidationTrigger[];
    dependencies: [
      FieldDescriptor<D1, Err>,
      FieldDescriptor<D2, Err>,
      FieldDescriptor<D3, Err>,
      FieldDescriptor<D4, Err>,
      FieldDescriptor<D5, Err>,
      FieldDescriptor<D6, Err>
    ];
  }): FieldValidator<T[], T, Err>;
};

/**
 * Create form validator based on provided set of validation rules.
 * Error type of all validation rules is specified by the FormSchema.
 * You can also specify validation dependencies between fields and validation triggers.
 *
 * @example
 * ```
 * const validator = createForm.validator(Schema, validate => [
 *   validate({
 *     field: Schema.password,
 *     rules: () => [required(), minLength(6)]
 *   }),
 *   validate({
 *     field: Schema.passwordConfirm,
 *     dependencies: [Schema.password],
 *     triggers: ["blur", "submit"],
 *     rules: (password) => [
 *       required(),
 *       val => val === password ? null : { code: "passwordMismatch" },
 *     ]
 *   }),
 *   validate.each({
 *     field: Schema.promoCodes,
 *     rules: () => [optional(), exactLength(6)],
 *   })
 * ])
 * ```
 */
export const createFormValidator = <Values extends object, Err>(
  form: FormSchema<Values, Err>,
  builder: (validate: ValidateFn<Err>) => Array<FieldValidator<any, any, Err>>
): FormValidator<Values, Err> => {
  throw new Error("not implemented!");
};
