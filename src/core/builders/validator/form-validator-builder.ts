import { Falsy, NoInfer, NonEmptyArray } from "../../../utils";
import { GenericFieldDescriptor } from "../../types/field-descriptor";
import { GenericFieldTemplate } from "../../types/field-template";
import { FormSchema } from "../../types/form-schema";
import {
  FormValidator,
  ValidationTrigger,
  Validator,
} from "../../types/form-validator";

import { createFormValidator } from "./create-form-validator";
import { createFieldValidator, FieldValidator } from "./field-validator";

/**
 * Create form validator based on provided set of validation rules.
 * Error type of all validation rules must be first defined using `FormSchemaBuilder`.
 * Behaviour of individual field validators can be further configured
 * by specifying `dependencies`, `triggers` or `debounce` options.
 *
 * @example
 * ```
 * const validator = new FormValidatorBuilder(Schema)
 *   .validate(
 *     Schema.password,
 *     required("password is required!"),
 *     minLength(6, "password must be at least 6 characters long!")
 *   )
 *   .validate({
 *     field: Schema.passwordConfirm,
 *     dependencies: [Schema.password],
 *     triggers: ["blur", "submit"],
 *     rules: (password) => [
 *       required("password confirmation is required!"),
 *       val => val === password ? null : "passwords are different",
 *     ]
 *   })
 *   .validate(
 *     Schema.promoCodes.every(),
 *     optional(),
 *     exactLength(6, "promo code must be 6 characters long")
 *   )
 *   .build()
 * ```
 */
export class FormValidatorBuilder<V extends object, Err> {
  private readonly fieldValidators: Array<FieldValidator<any, Err, any>>;
  private readonly schema: FormSchema<V, Err>;

  /**
   * Create form validator based on provided set of validation rules.
   * Error type of all validation rules must be first defined using `FormSchemaBuilder`.
   * Behaviour of individual field validators can be further configured
   * by specifying `dependencies`, `triggers` or `debounce` options.
   *
   * @example
   * ```
   * const validator = new FormValidatorBuilder(Schema)
   *   .validate(
   *     Schema.password,
   *     required("password is required!"),
   *     minLength(6, "password must be at least 6 characters long!")
   *   )
   *   .validate({
   *     field: Schema.passwordConfirm,
   *     dependencies: [Schema.password],
   *     triggers: ["blur", "submit"],
   *     rules: (password) => [
   *       required("password confirmation is required!"),
   *       val => val === password ? null : "passwords are different",
   *     ]
   *   })
   *   .validate(
   *     Schema.promoCodes.every(),
   *     optional(),
   *     exactLength(6, "promo code must be 6 characters long")
   *   )
   *   .build()
   * ```
   */
  constructor(schema: FormSchema<V, Err>) {
    this.fieldValidators = [];
    this.schema = schema;
  }

  validate: ValidateFn<V, Err> = (...args: [any, ...any]) => {
    this.fieldValidators.push(createFieldValidator(...args));

    return this as any;
  };

  // @ts-ignore
  private build = () => createFormValidator(this.schema, this.fieldValidators);
}

interface FormValidatorBuilder$Complete<V extends object, Err> {
  validate: ValidateFn<V, Err>;

  /** finalize construction of `FormValidator` */
  build: () => FormValidator<V, Err>;
}

type ValidateFn<V extends object, Err> = {
  /**
   * Define field validation options and rules using configuration object.
   * Can be invoked multiple times for the same field with different options.
   * 
   * @example 
   * ```ts
      new FormValidatorBuilder(Schema)
        .validate({ 
          field: Schema.myField,
          dependencies: [Schema.otherField]
          triggers: ["blur"],
          rules: (otherFieldValue) => [
             rule1(),
             rule2(),
          ],
        })
   * ```
   */
  <T, Dependencies extends any[]>(
    config: ValidateConfig<T, Err, Dependencies>
  ): FormValidatorBuilder$Complete<V, Err>;

  /**
   * Define field validation rules. 
   * For more options use second overload.
   * Can be invoked multiple times for the same field.
   * 
   * @example 
   * ```ts
      new FormValidatorBuilder(Schema)
        .validate(Schema.myField, rule1(), rule2())
   * ```
   */
  <T>(
    field: ValidationFieldPointer<T, Err>,
    ...rules: NonEmptyArray<Validator<T, NoInfer<Err>>>
  ): FormValidatorBuilder$Complete<V, Err>;
};

export type ValidateConfig<T, Err, Dependencies extends any[]> = {
  /**
     * Pointer to the field to be validated, provided by `FormSchema`.
     * 
     * If the field is an array there are 3 options:
     *  - `Schema.arrayField` - validate entire array
     *  - `Schema.arrayField.every()` - validate every element of the array separately 
     *  - `Schema.arrayField.nth(x)` - validate only element at index `x`
     * 
     * @example
     * ```ts
        new FormValidatorBuilder(Schema)
          .validate({ 
            field: Schema.stringField,
            rules: () => [(_val: string) => "error!"],
          })
          .validate({ 
            field: Schema.stringArrayField,
            rules: () => [(_arr: string[]) => "error!"], 
          })
          .validate({ 
            field: Schema.stringArrayField.every(), 
            rules: () => [(_el: string) => "error!"], 
          })
          .validate({ 
            field: Schema.stringArrayField.nth(0), 
            rules: () => [(_el0: string) => "error!"], 
          })
          .build()
     * ```
     */
  field: ValidationFieldPointer<T, Err>;

  /**
   * If specified, can narrow down set of events that cause running the validation rules.
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
        new FormValidatorBuilder(Schema)
          .validate({
            field: Schema.passwordConfirm,
            dependencies: [Schema.password]
            rules: (password) => [
              val => val !== password ? "error!" : null
            ],
          })
          .build()
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
        new FormValidatorBuilder(Schema)
          .validate({
            field: Schema.parentsConsent,
            dependencies: [Schema.age]
            rules: (age) => [
              age < 18 && required("Field is required!")
            ],
          })
          .build()
     * ```
     */
  rules: (
    ...deps: [...Dependencies]
  ) => Array<Falsy | Validator<T, NoInfer<Err>>>;
};

export type ValidationFieldPointer<T, Err> =
  | GenericFieldDescriptor<T, Err>
  | GenericFieldTemplate<T, Err>;

export type FieldDescTuple<ValuesTuple extends readonly any[], Err> = {
  [Index in keyof ValuesTuple]: GenericFieldDescriptor<ValuesTuple[Index], Err>;
};
