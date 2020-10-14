import { Falsy } from "../../utils";

import { FieldDescriptor } from "./field-descriptor";

/**
 * Function responsible for validating single field.
 *
 * @param value - value to be validated of type `T`
 *
 * @returns validation error of type `Err`, or `null` when field is valid
 */
export type Validator<T, Err> = ValidatorSync<T, Err> | ValidatorAsync<T, Err>;

export type ValidatorSync<T, Err> = (value: T) => Err | null;

export type ValidatorAsync<T, Err> = (value: T) => Promise<Err | null>;

export type ValidationTrigger = "change" | "blur" | "submit";

export type FormValidator<Values extends object, Err> = {
  validate: (
    fields: Array<FieldDescriptor<unknown, Err>>,
    getValue: <P>(field: FieldDescriptor<P, Err>) => P,
    trigger?: ValidationTrigger
  ) => Promise<
    Array<{ field: FieldDescriptor<unknown, Err>; error: Err | null }>
  >;
};

export type FieldValidator<T, Err, Dependencies extends any[]> = {
  type: "field" | "each";
  field: FieldDescriptor<T, Err>;
  triggers?: Array<ValidationTrigger>;
  validators: (...deps: [...Dependencies]) => Array<Falsy | Validator<T, Err>>;
  dependencies?: readonly [...FieldDescTuple<Dependencies>];
};

export type ValidateFn = {
  each: ValidateEachFn;

  <T, Err, Dependencies extends any[]>(config: {
    field: FieldDescriptor<T, Err>;
    triggers?: ValidationTrigger[];
    dependencies?: readonly [...FieldDescTuple<Dependencies>];
    rules: (...deps: [...Dependencies]) => Array<Falsy | Validator<T, Err>>;
  }): FieldValidator<T, Err, Dependencies>;
};

export type ValidateEachFn = <T, Err, Dependencies extends any[]>(config: {
  field: FieldDescriptor<T[], Err>;
  triggers?: ValidationTrigger[];
  dependencies?: readonly [...FieldDescTuple<Dependencies>];
  rules: (...deps: [...Dependencies]) => Array<Falsy | Validator<T, Err>>;
}) => FieldValidator<T, Err, Dependencies>;

type FieldDescTuple<ValuesTuple extends readonly any[]> = {
  [Index in keyof ValuesTuple]: FieldDescriptor<ValuesTuple[Index]>;
};
