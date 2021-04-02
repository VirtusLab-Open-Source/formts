import { isFalsy } from "../../utils";
import { compact, flatMap, uniqBy } from "../../utils/array";
import { Task } from "../../utils/task";
import {
  FieldDescriptor,
  getChildrenDescriptors,
  getParentsChain,
} from "../types/field-descriptor";
import {
  generateFieldPathsFromTemplate,
  pathIsTemplate,
} from "../types/field-template";
import { FormSchema } from "../types/form-schema";
import {
  FieldDescTuple,
  FieldPath,
  FieldValidator,
  FormValidator,
  GetValue,
  ValidateConfig,
  ValidateField,
  ValidateFn,
  ValidationTrigger,
  Validator,
  _FormValidatorImpl,
} from "../types/form-validator";
import { impl, opaque } from "../types/type-mapper-util";

/**
 * Create form validator based on provided set of validation rules.
 * Error type of all validation rules is specified by the FormSchema.
 * You can also specify validation dependencies between fields and validation triggers.
 *
 * @example
 * ```
 * const validator = createFormValidator(Schema, validate => [
 *   validate(Schema.password, required(), minLength(6)),
 *   validate({
 *     field: Schema.passwordConfirm,
 *     dependencies: [Schema.password],
 *     triggers: ["blur", "submit"],
 *     rules: (password) => [
 *       required(),
 *       val => val === password ? null : { code: "passwordMismatch" },
 *     ]
 *   }),
 *   validate(Schema.promoCodes.nth, optional(), exactLength(6))
 * ])
 * ```
 */
export const createFormValidator = <Values extends object, Err>(
  _schema: FormSchema<Values, Err>,
  builder: (
    validate: ValidateFn
  ) => Array<FieldValidator<any, Err, any | unknown>>
): FormValidator<Values, Err> => {
  const allValidators = builder(validate());
  const dependenciesDict = buildDependenciesDict(allValidators);

  const ongoingValidationTimestamps: Record<
    FieldValidationKey,
    Timestamp | undefined
  > = {};

  const debounceStepHandler = DebouncedValidation.createDebounceStepHandler();

  const getValidatorsForField = (
    fieldPath: FieldPath,
    trigger?: ValidationTrigger
  ): FieldValidator<any, Err, any[]>[] => {
    return allValidators.filter(x => {
      const triggerMatches =
        trigger && x.triggers ? x.triggers.includes(trigger) : true;
      return triggerMatches && validatorMatchesField(x, fieldPath);
    });
  };

  const formValidator: _FormValidatorImpl<Values, Err> = {
    validate: ({
      fields,
      trigger,
      getValue,
      onFieldValidationStart,
      onFieldValidationEnd,
    }) => {
      const timestamp = Timestamp.make();

      const resolveFieldsToValidate = () => {
        const allFields = flatMap(fields, x =>
          getChildrenDescriptors(x, getValue).map(x => impl(x).__path)
        );
        const dependents = flatMap(fields, x =>
          getDependents(x, dependenciesDict, getValue)
        );
        const parents = flatMap(fields, x =>
          getParentsChain(x).map(x => impl(x).__path)
        );

        const uniqueFields = uniqBy(
          [...allFields, ...dependents, ...parents],
          x => x
        );

        return uniqueFields
          .map(fieldPath => ({
            fieldPath,
            validators: getValidatorsForField(fieldPath, trigger),
          }))
          .filter(x => x.validators.length > 0);
      };

      return Task.from(resolveFieldsToValidate)
        .flatMap(fieldsToValidate =>
          Task.all(
            ...fieldsToValidate.map(({ fieldPath, validators }) => {
              const validationKey = FieldValidationKey.make(fieldPath, trigger);

              return Task.from(() => {
                onFieldValidationStart?.(fieldPath);
                ongoingValidationTimestamps[validationKey] = timestamp;
                return getValue(fieldPath);
              })
                .flatMap(value =>
                  firstNonNullTaskResult(
                    validators.map(v =>
                      debounceStepHandler(v, fieldPath).flatMap(() =>
                        runValidationForField(v, value, getValue)
                      )
                    )
                  )
                )
                .flatMapErr(err => {
                  if (err === true) {
                    return Task.success(null); // optional validator edge-case
                  }
                  onFieldValidationEnd?.(fieldPath);
                  return Task.failure(err);
                })
                .map(validationError => {
                  onFieldValidationEnd?.(fieldPath);

                  if (
                    ongoingValidationTimestamps[validationKey] === timestamp
                  ) {
                    delete ongoingValidationTimestamps[validationKey];
                    return { path: fieldPath, error: validationError };
                  }

                  // primitive cancellation of outdated validation results
                  return null;
                })
                .flatMapErr(DebouncedValidation.flatMapCancel);
            })
          )
        )
        .map(compact);
    },
  };

  return opaque(formValidator);
};

const validate = (): ValidateFn => {
  let index = 0;

  return <T, Err, Deps extends any[]>(
    x: ValidateConfig<T, Err, Deps> | ValidateField<T, Err>,
    ...rules: Array<Validator<T, Err>>
  ): FieldValidator<T, Err, Deps> => {
    const config: ValidateConfig<T, Err, Deps> =
      (x as any)["field"] != null
        ? { ...(x as ValidateConfig<T, Err, Deps>) }
        : { field: x as ValidateField<T, Err>, rules: () => rules };

    return {
      id: (index++).toString(),
      path: impl(config.field).__path,
      triggers: config.triggers,
      validators: config.rules,
      dependencies: config.dependencies,
      debounce: config.debounce,
    };
  };
};

const runValidationForField = <Value, Err, Dependencies extends any[]>(
  validator: FieldValidator<Value, Err, Dependencies>,
  value: Value,
  getValue: GetValue<Err>
): Task<Err | null, unknown> => {
  const dependenciesValues = !!validator.dependencies
    ? getDependenciesValues(validator.dependencies, getValue)
    : (([] as unknown) as Dependencies);

  const rules = validator
    .validators(...dependenciesValues)
    .filter(x => !isFalsy(x)) as Validator<Value, Err>[];

  return firstNonNullTaskResult(
    rules.map(rule => Task.from(() => rule(value)))
  );
};

const firstNonNullTaskResult = <T, E>(
  tasks: Array<Task<T | null, E>>
): Task<T | null, E> => {
  if (tasks.length === 0) {
    return Task.success(null);
  }

  const [first, ...rest] = tasks;
  return first.flatMap(result =>
    result != null ? Task.success(result) : firstNonNullTaskResult(rest)
  );
};

type DependenciesDict = {
  [path: string]: FieldPath[];
};

const buildDependenciesDict = <Err>(
  validators: FieldValidator<any, Err, any>[]
): DependenciesDict => {
  let dict: DependenciesDict = {};

  for (const validator of validators) {
    for (const dependency of validator.dependencies ?? []) {
      const path = impl(dependency).__path;

      if (!dict[path]) {
        dict[path] = [validator.path];
      } else {
        dict[path].push(validator.path);
      }
    }
  }

  return dict;
};

const getDependents = <Err>(
  desc: FieldDescriptor<any, Err>,
  dependenciesDict: DependenciesDict,
  getValue: GetValue<Err>
): FieldPath[] =>
  flatMap(dependenciesDict[impl(desc).__path] ?? [], x => {
    if (pathIsTemplate(x)) {
      return generateFieldPathsFromTemplate(x, getValue);
    } else {
      return [x];
    }
  });

const getDependenciesValues = <Values extends readonly any[], Err>(
  deps: readonly [...FieldDescTuple<Values, Err>],
  getValue: GetValue<Err>
): Values => {
  return deps.map(x => getValue(x)) as any;
};

const validatorMatchesField = (
  validator: FieldValidator<any, any, any[]>,
  fieldPath: FieldPath
): boolean => {
  if (pathIsTemplate(validator.path)) {
    return pathMatchesTemplatePath(fieldPath, validator.path);
  } else {
    return validator.path === fieldPath;
  }
};

const pathMatchesTemplatePath = (path: string, template: string) => {
  if (!template.includes("[*]")) {
    return false;
  } else {
    const templateRegex = template
      .replace(new RegExp("\\.", "g"), "\\.")
      .replace(new RegExp("\\[", "g"), "\\[")
      .replace(new RegExp("\\]", "g"), "\\]")
      .replace(new RegExp("\\*", "g"), "(\\d+)");

    return !!path.match(new RegExp(`\^${templateRegex}\$`));
  }
};

type FieldValidationKey = string;
namespace FieldValidationKey {
  export const make = (
    fieldPath: FieldPath,
    trigger?: ValidationTrigger
  ): FieldValidationKey => `${fieldPath}:t-${trigger ?? "none"}` as any;
}

type Timestamp = number;
namespace Timestamp {
  export const make = () => Date.now();
}

namespace DebouncedValidation {
  type Cancel = () => void;
  type DebouncedValidationsDict = Record<FieldValidationKey, Cancel>;
  type DebounceStepHandler = (
    validator: FieldValidator<unknown, unknown, unknown[]>,
    fieldPath: FieldPath
  ) => Task<void>;

  const CANCEL_ERR = "__CANCEL__";

  export const createDebounceStepHandler = (): DebounceStepHandler => {
    const debouncedValidations: DebouncedValidationsDict = {};

    return (v, fieldPath) =>
      Task.make(({ resolve, reject }) => {
        const id = `${v.id}-${fieldPath}`;
        if (v.debounce) {
          debouncedValidations[id]?.();

          const timeout = setTimeout(() => {
            delete debouncedValidations[id];
            resolve();
          }, v.debounce);

          debouncedValidations[id] = () => {
            clearTimeout(timeout);
            reject(CANCEL_ERR);
          };
        } else {
          resolve();
        }
      });
  };

  export const flatMapCancel = (err: unknown) => {
    if (err === CANCEL_ERR) {
      return Task.success(null);
    } else {
      return Task.failure(err);
    }
  };
}
