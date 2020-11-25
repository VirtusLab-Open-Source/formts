import { isFalsy } from "../../utils";
import { flatMap, uniqBy } from "../../utils/array";
import {
  ArrayFieldDescriptor,
  FieldDescriptor,
  getArrayDescriptorChildren,
  getObjectDescriptorChildren,
  isArrayDescriptor,
  isObjectDescriptor,
} from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";
import {
  FieldValidator,
  FormValidator,
  ValidateConfig,
  ValidateField,
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
 * const validator = createFormValidator(Schema, validate => [
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
    validate: ({
      fields,
      trigger,
      getValue,
      onFieldValidationStart,
      onFieldValidationEnd,
    }) => {
      const allFields = flatMap(fields, x =>
        getChildrenDescriptors(x, getValue)
      );
      const uniqueFields = uniqBy(allFields, x => impl(x).__path);

      const fieldsToValidate = uniqueFields
        .map(field => ({
          field,
          validators: getValidatorsForField(field, trigger),
        }))
        .filter(x => x.validators.length > 0);

      return Promise.all(
        fieldsToValidate.map(({ field, validators }) => {
          const value = getValue(field);

          onFieldValidationStart?.(field);
          return firstNonNullPromise(validators, v =>
            runValidationForField(v, value)
          )
            .catch(err => {
              if (err === true) {
                return null; // optional validator edge-case
              }
              onFieldValidationEnd?.(field);
              throw err;
            })
            .then(error => {
              onFieldValidationEnd?.(field);
              return { field, error };
            });
        })
      );
    },
  };

  return formValidator;
};

const validate: ValidateFn = <T, Err, Deps extends any[]>(
  x: ValidateConfig<T, Err, Deps> | ValidateField<T, Err>,
  ...rules: Array<Validator<T, Err>>
): FieldValidator<T, Err, Deps> => {
  const config: ValidateConfig<T, Err, Deps> =
    typeof x === "object"
      ? { ...(x as ValidateConfig<T, Err, Deps>) }
      : { field: x as ValidateField<T, Err>, rules: () => rules };

  const isNth = typeof config.field === "function";
  let path = "";

  if (isNth) {
    const firstElementPath = impl(
      (config.field as ArrayFieldDescriptor<T[], Err>["nth"])(0)
    ).__path;
    path = firstElementPath.slice(0, -3);
  } else {
    path = impl(config.field as FieldDescriptor<T, Err>).__path;
  }

  return {
    type: isNth ? "each" : "field",
    field: { __path: path } as any,
    triggers: config.triggers,
    validators: config.rules,
    dependencies: config.dependencies,
  };
};

const runValidationForField = <Value, Err>(
  validator: FieldValidator<Value, Err, unknown[]>,
  value: Value
): Promise<Err | null> => {
  const rules = validator
    .validators([] as any)
    .filter(x => !isFalsy(x)) as Validator<Value, Err>[];

  return firstNonNullPromise(rules, rule => {
    try {
      return Promise.resolve(rule(value));
    } catch (err) {
      return Promise.reject(err);
    }
  });
};

const firstNonNullPromise = <T, V>(
  list: T[],
  provider: (x: T) => Promise<V | null>
): Promise<V | null> => {
  if (list.length === 0) {
    return Promise.resolve(null);
  }

  const [el, ...rest] = list;
  return provider(el).then(result =>
    result != null ? result : firstNonNullPromise(rest, provider)
  );
};

const getChildrenDescriptors = (
  descriptor: FieldDescriptor<unknown, unknown>,
  getValue: (field: FieldDescriptor<unknown, unknown>) => unknown
): Array<FieldDescriptor<unknown, unknown>> => {
  const root = [descriptor];

  if (isObjectDescriptor(descriptor)) {
    const children = getObjectDescriptorChildren(descriptor);
    return root.concat(
      flatMap(children, x => getChildrenDescriptors(x, getValue))
    );
  } else if (isArrayDescriptor(descriptor)) {
    const numberOfChildren = (getValue(descriptor) as any[]).length;
    const children = getArrayDescriptorChildren(descriptor, numberOfChildren);
    return root.concat(
      flatMap(children, x => getChildrenDescriptors(x, getValue))
    );
  } else {
    return root;
  }
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
