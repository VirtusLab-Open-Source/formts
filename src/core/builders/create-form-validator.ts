import { isFalsy } from "../../utils";
import { FieldDescriptor } from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";
import {
  FieldValidator,
  FormValidator,
  ValidateFn,
  ValidationTrigger,
  Validator,
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
  builder: (validate: ValidateFn) => Array<FieldValidator<any, Err, any[]>>
): FormValidator<Values, Err> => {
  const allValidators = builder(validate);

  const getValidatorsForField = (
    descriptor: FieldDescriptor<unknown, Err>,
    trigger?: ValidationTrigger
  ): FieldValidator<any, Err, any[]>[] => {
    const path = impl(descriptor).__path;
    const rootArrayPath = getRootArrayPath(path);

    return allValidators.filter(x => {
      const xPath = impl(x.field).__path;
      const isFieldMatch = x.type === "field" && xPath === path;
      const isEachMatch = x.type === "each" && xPath === rootArrayPath;
      const triggerMatches =
        trigger && x.triggers ? x.triggers.includes(trigger) : true;

      return triggerMatches && (isFieldMatch || isEachMatch);
    });
  };

  const formValidator: FormValidator<Values, Err> = {
    validate: (fields, getValue, trigger) => {
      const fieldsToValidate = fields
        .map(field => ({
          field,
          validators: getValidatorsForField(field, trigger),
        }))
        .filter(x => x.validators.length > 0);

      return Promise.all(
        fieldsToValidate.map(async ({ field, validators }) => {
          const value = getValue(field);
          const error = await firstNonNullPromise(validators, x =>
            runValidationForField(x, value)
          );

          return { field, error };
        })
      );
    },
  };

  return formValidator;
};

const validate: ValidateFn = config => ({
  type: "field",
  field: config.field,
  triggers: config.triggers,
  validators: config.rules,
  dependencies: config.dependencies,
});

validate.each = config => ({
  type: "each",
  field: config.field as any,
  triggers: config.triggers,
  validators: config.rules,
  dependencies: config.dependencies,
});

const runValidationForField = async <Value, Err>(
  validator: FieldValidator<Value, Err, unknown[]>,
  value: Value
): Promise<Err | null> => {
  const rules = validator
    .validators([] as any)
    .filter(x => !isFalsy(x)) as Validator<Value, Err>[];

  return firstNonNullPromise(rules, async rule => await rule(value));
};

const firstNonNullPromise = async <T, V>(
  list: T[],
  mapper: (x: T) => Promise<V | null>
): Promise<V | null> => {
  for (const x of list) {
    const result = await mapper(x);
    if (result != null) {
      return result;
    }
  }
  return null;
};

// TODO rethink
const getRootArrayPath = (path: string): string | undefined => {
  const isArrayElement = path.lastIndexOf("]") === path.length - 1;
  if (!isArrayElement) {
    return undefined;
  } else {
    const indexStart = path.lastIndexOf("[");
    return path.slice(0, indexStart);
  }
};
