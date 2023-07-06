import { Nominal } from "../../utils";
import { Task } from "../../utils/task";

import { FieldDescriptor } from "./field-descriptor";

export type Validator<T, Err> =
  | Validator.Sync<T, Err>
  | Validator.Async<T, Err>;

export namespace Validator {
  /**
   * Function responsible for validating single field.
   *
   * @param value - value to be validated of type `T`
   *
   * @returns validation error of type `Err`, or `null` when field is valid
   */
  export type Sync<T, Err> = (value: T) => Err | null;

  /**
   * Function responsible for validating single field asynchronously.
   *
   * @param value - value to be validated of type `T`
   *
   * @returns Promise of validation error of type `Err`, or `null` when field is valid
   */
  export type Async<T, Err> = (value: T) => Promise<Err | null>;
}

export type ValidationTrigger = "change" | "blur" | "submit";

export type ValidationResult<Err> = Array<{
  path: FieldPath;
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

/**
 * Object created via `FormValidatorBuilder`, used by passing it to `useFormController` hook.
 */
export interface FormValidator<Values extends object, Err>
  extends Nominal<"FormValidator", Values, Err> {}

// @ts-ignore
export type _FormValidatorImpl<Values extends object, Err> = {
  validate: (input: ValidateIn<Err>) => Task<ValidationResult<Err>, unknown>;
};

export type FieldPath = string;
