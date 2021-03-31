import { Falsy, NoInfer, Nominal } from "../../utils";
import { Task } from "../../utils/task";

import {
  FieldDescriptor,
  GenericFieldDescriptor,
} from "./field-descriptor";
import { GenericFieldTemplate } from "./field-template";

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
  path: FieldPath
  error: Err | null;
}>;

export type ValidateIn<Err> = {
  fields: Array<FieldDescriptor<unknown, Err>>;
  trigger?: ValidationTrigger;
  getValue: GetValue<Err>;
  onFieldValidationStart?: (fieldPath: FieldPath) => void;
  onFieldValidationEnd?: (fieldPath: FieldPath) => void;
};

export type GetValue<Err> = {
  <P>(field: FieldDescriptor<P, Err>): P;
  <P>(path: string): P;
};

export interface FormValidator<Values extends object, Err>
  extends Nominal<"FormValidator", Values, Err> {}

// @ts-ignore
export type _FormValidatorImpl<Values extends object, Err> = {
  validate: (input: ValidateIn<Err>) => Task<ValidationResult<Err>, unknown>;
};

export type FieldValidator<T, Err, Dependencies extends any[]> = {
  id: string;
  path: FieldPath;
  triggers?: Array<ValidationTrigger>;
  validators: (...deps: [...Dependencies]) => Array<Falsy | Validator<T, Err>>;
  dependencies?: readonly [...FieldDescTuple<Dependencies, Err>];
  debounce?: number;
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
  /**
   * Pointer to the field to be validated.
   * If the field is an array field descriptor then validation rules will be run for the entire array,
   * but if it is it's `nth` function, validation rules will be run for each item individually.
   * 
   * @example
   * 
   * ```ts
      createFormValidator(Schema, validate => [
        validate({
          field: Schema.stringField,
          rules: () => [(_val: string) => "error!"],
        }),
        validate({
          field: Schema.stringArrayField,
          rules: () => [(_arr: Array<string>) => "error!"],
        }),
        validate({
          field: Schema.stringArrayField.nth,
          rules: () => [(_item: string) => "error!"],
        }),
      ]);
   * ```
   */
  field: ValidateField<T, Err>;

  /**
   * If specified, will restrict running validation rules to only when caused by appropriate events.
   * Imperatively invoked validation will always run, regardless of triggers.
   */
  triggers?: ValidationTrigger[];

  /**
   * If specified:
   *  - will inject respective dependency fields' values into `rules` function for usage in validation
   *  - changes to any of the dependencies will cause validation of this field (respecting trigger rules if present)
   * 
   * @example
   * 
   * ```ts
      createFormValidator(Schema, validate => [
        validate({
          field: Schema.passwordConfirm,
          dependencies: [Schema.password]
          rules: (password) => [val => val !== password ? "error!" : null],
        }),
      ]);
   * ```
   */
  dependencies?: readonly [...FieldDescTuple<Dependencies, Err>];

  /**
   * If specified, will wait provided amount of milliseconds before running validation rules.
   * If validation for the field is run again in that time, timer is reset.
   * Use this to limit number of invocations of expensive validation rules (e.g. async server calls).
   * Note: this will affect all downstream validation rules for the field.
   */
  debounce?: number;

  /**
   * Function receiving value of fields specified in `dependencies` prop and returning validation rules.
   * Validation rules are functions receiving field value and returning `Err` or null.
   * You can also pass `false | null | undefined` in place of validator function - it will be ignored. 
   * 
   * @example
   * 
   * ```ts
      createFormValidator(Schema, validate => [
        validate({
          field: Schema.parentsConsent,
          dependencies: [Schema.age]
          rules: (age) => [age < 18 && required()],
        }),
      ]);
   * ```
   */
  rules: (
    ...deps: [...Dependencies]
  ) => Array<Falsy | Validator<T, NoInfer<Err>>>;
};

export type ValidateField<T, Err> =
  | GenericFieldDescriptor<T, Err>
  | GenericFieldTemplate<T, Err>

export type FieldDescTuple<ValuesTuple extends readonly any[], Err> = {
  [Index in keyof ValuesTuple]: GenericFieldDescriptor<ValuesTuple[Index], Err>;
};

export type FieldPath = string