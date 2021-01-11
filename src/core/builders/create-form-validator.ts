import { isFalsy } from "../../utils";
import { flatMap, uniqBy } from "../../utils/array";
import {
  FieldDescriptor,
  getArrayDescriptorChildren,
  getObjectDescriptorChildren,
  isArrayDescriptor,
  isObjectDescriptor,
} from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";
import {
  FieldDescTuple,
  FieldValidator,
  FormValidator,
  GetValue,
  isNth,
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
  builder: (
    validate: ValidateFn
  ) => Array<FieldValidator<any, Err, any | unknown>>
): FormValidator<Values, Err> => {
  const allValidators = builder(validate);
  const dependenciesDict = buildDependenciesDict(allValidators);

  const getValidatorsForField = (
    descriptor: FieldDescriptor<unknown, Err>,
    trigger?: ValidationTrigger
  ): FieldValidator<any, Err, any[]>[] => {
    return allValidators.filter(x => {
      const triggerMatches =
        trigger && x.triggers ? x.triggers.includes(trigger) : true;
      return triggerMatches && validatorMatchesField(x, descriptor);
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
      const dependents = flatMap(fields, x =>
        getDependents(x, dependenciesDict, getValue)
      );
      const uniqueFields = uniqBy(
        [...allFields, ...dependents],
        x => impl(x).__path
      );

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
            runValidationForField(v, value, getValue)
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
    (x as any)["field"] != null
      ? { ...(x as ValidateConfig<T, Err, Deps>) }
      : { field: x as ValidateField<T, Err>, rules: () => rules };

  return {
    field: config.field,
    triggers: config.triggers,
    validators: config.rules,
    dependencies: config.dependencies,
  };
};

const runValidationForField = <Value, Err, Dependencies extends any[]>(
  validator: FieldValidator<Value, Err, Dependencies>,
  value: Value,
  getValue: GetValue
): Promise<Err | null> => {
  const dependenciesValues = !!validator.dependencies
    ? getDependenciesValues(validator.dependencies, getValue)
    : (([] as unknown) as Dependencies);

  const rules = validator
    .validators(...dependenciesValues)
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

type DependenciesDict = {
  [path: string]: ValidateField<unknown, unknown>[];
};

const buildDependenciesDict = (
  validators: FieldValidator<any, any, any>[]
): DependenciesDict => {
  let dict: DependenciesDict = {};

  for (const validator of validators) {
    for (const dependency of validator.dependencies ?? []) {
      const path = impl(dependency).__path;

      if (!dict[path]) {
        dict[path] = [validator.field];
      } else {
        dict[path].push(validator.field);
      }
    }
  }

  return dict;
};

const getDependents = (
  desc: FieldDescriptor<any>,
  dependenciesDict: DependenciesDict,
  getValue: GetValue
): FieldDescriptor<any>[] => {
  return flatMap(dependenciesDict[impl(desc).__path] ?? [], x => {
    if (isNth(x)) {
      const rootPath = impl(x).__rootPath;
      return getValue<any[]>(rootPath).map((_, i) => x(i));
    } else {
      return [x];
    }
  });
};

const getDependenciesValues = <Values extends readonly any[]>(
  deps: readonly [...FieldDescTuple<Values>],
  getValue: GetValue
): Values => {
  return deps.map(x => getValue(x)) as any;
};

const validatorMatchesField = (
  validator: FieldValidator<any, any, any[]>,
  field: FieldDescriptor<any>
): boolean => {
  if (isNth(validator.field)) {
    const validatorRootPath = impl(validator.field).__rootPath;
    const fieldRootPath = getRootArrayPath(impl(field).__path);
    return validatorRootPath === fieldRootPath;
  } else {
    return impl(validator.field).__path === impl(field).__path;
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
