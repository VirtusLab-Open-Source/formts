import { Falsy, NoInfer } from "../../utils";

import {
  ArrayFieldDescriptor,
  FieldDescriptor,
  GenericFieldDescriptor,
} from "./field-descriptor";

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
  export type Sync<T, Err> = (value: T) => Err | null;

  export type Async<T, Err> = (value: T) => Promise<Err | null>;
}

export type ValidationTrigger = "change" | "blur" | "submit";

export type ValidationResult<Err> = Array<{
  field: FieldDescriptor<unknown, Err>;
  error: Err | null;
}>;

export type ValidateIn<Err> = {
  fields: Array<FieldDescriptor<unknown, Err>>;
  trigger?: ValidationTrigger;
  getValue: GetValue;
  onFieldValidationStart?: (field: FieldDescriptor<unknown, Err>) => void;
  onFieldValidationEnd?: (field: FieldDescriptor<unknown, Err>) => void;
};

export type GetValue = {
  <P>(field: FieldDescriptor<P, unknown>): P;
  <P>(path: string): P;
};

// @ts-ignore
export type FormValidator<Values extends object, Err> = {
  validate: (input: ValidateIn<Err>) => Promise<ValidationResult<Err>>;
};

export type FieldValidator<T, Err, Dependencies extends any[]> = {
  field: ValidateField<T, Err>;
  triggers?: Array<ValidationTrigger>;
  validators: (...deps: [...Dependencies]) => Array<Falsy | Validator<T, Err>>;
  dependencies?: readonly [...FieldDescTuple<Dependencies>];
};

export type ValidateFn = {
  <T, Err, Dependencies extends any[]>(
    config: ValidateConfig<T, Err, Dependencies>
  ): FieldValidator<T, Err, Dependencies>;

  <T, Err>(
    field: ValidateField<T, Err>,
    ...rules: Array<Validator<T, NoInfer<Err>>>
  ): FieldValidator<T, Err, []>;
};

export type ValidateConfig<T, Err, Dependencies extends any[]> = {
  field: ValidateField<T, Err>;
  triggers?: ValidationTrigger[];
  dependencies?: readonly [...FieldDescTuple<Dependencies>];
  rules: (
    ...deps: [...Dependencies]
  ) => Array<Falsy | Validator<T, NoInfer<Err>>>;
};

export type ValidateField<T, Err> =
  | GenericFieldDescriptor<T, Err>
  | ArrayFieldDescriptor<T[], Err>["nth"];

export type FieldDescTuple<ValuesTuple extends readonly any[]> = {
  [Index in keyof ValuesTuple]: GenericFieldDescriptor<ValuesTuple[Index]>;
};

export const isNth = <T, Err>(
  x: ValidateField<T, Err>
): x is ArrayFieldDescriptor<T[], Err>["nth"] => typeof x === "function";
