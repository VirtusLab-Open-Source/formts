import { isFalsy } from "../../utils";
import { FieldDescriptor } from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";
import {
  FieldValidator,
  FormValidator,
  ValidateFn,
  ValidationTrigger,
} from "../types/form-validator";
import { impl } from "../types/type-mapper-util";

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
  _schema: FormSchema<Values, Err>,
  builder: (
    validate: ValidateFn
  ) => Array<FieldValidator<unknown, Err, unknown[]>>
): FormValidator<Values, Err> => {
  const validators = builder(validate).reduce((acc, x) => {
    (acc as any)[impl(x.field).path] = x;
    return acc;
  }, {} as Record<string, FieldValidator<unknown, Err, unknown[]>>);

  const shouldFireValidation = (
    descriptor: FieldDescriptor<unknown, Err>,
    trigger?: ValidationTrigger
  ): boolean => {
    if (!trigger) {
      return true;
    } else {
      const fieldValidator = validators[impl(descriptor).path];
      return fieldValidator
        ? fieldValidator.triggers
          ? fieldValidator.triggers.includes(trigger)
          : true
        : false;
    }
  };

  const formValidator: FormValidator<Values, Err> = {
    validate: (fields, getValue, trigger) => {
      const fieldsToValidate = fields.filter(x =>
        shouldFireValidation(x, trigger)
      );

      return Promise.all(
        fieldsToValidate.map(async field => {
          const fieldValidator = validators[impl(field).path]!;
          const value = getValue(field);
          const error = await runValidationForField(fieldValidator, value);

          return { field, error };
        })
      );
    },
  };

  return formValidator;
};

const validate: ValidateFn = config => ({
  type: "inner",
  field: config.field,
  triggers: config.triggers,
  validators: config.rules,
  dependencies: config.dependencies,
});

const runValidationForField = async <Value, Err>(
  validator: FieldValidator<Value, Err, unknown[]>,
  value: Value
): Promise<Err | null> => {
  const rules = validator.validators([] as any);
  for (const rule of rules) {
    if (!isFalsy(rule)) {
      const result = await rule(value);
      if (result !== null) {
        return result;
      }
    }
  }
  return null;
};
