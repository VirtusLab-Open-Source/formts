import { isFalsy } from "../../../utils";
import { compact, flatMap, uniqBy } from "../../../utils/array";
import { Task } from "../../../utils/task";
import {
  FieldDescriptor,
  getChildrenDescriptors,
  getParentsChain,
} from "../../types/field-descriptor";
import {
  generateFieldPathsFromTemplate,
  pathIsTemplate,
} from "../../types/field-template";
import { FormSchema } from "../../types/form-schema";
import {
  FieldPath,
  FormValidator,
  GetValue,
  ValidationTrigger,
  Validator,
  _FormValidatorImpl,
} from "../../types/form-validator";
import { impl, opaque } from "../../types/type-mapper-util";

import { FieldValidator } from "./field-validator";
import { FieldDescTuple } from "./form-validator-builder";

export const createFormValidator = <Values extends object, Err>(
  _schema: FormSchema<Values, Err>,
  validators: Array<FieldValidator<any, Err, any>>
): FormValidator<Values, Err> => {
  const dependenciesDict = buildDependenciesDict(validators);

  const ongoingValidationTimestamps: Record<
    FieldValidationKey,
    Timestamp | undefined
  > = {};

  const debounceStepHandler = DebouncedValidation.createDebounceStepHandler();

  const getValidatorsForField = (
    fieldPath: FieldPath,
    trigger?: ValidationTrigger
  ): FieldValidator<any, Err, any[]>[] => {
    return validators.filter(x => {
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
  if (validator.regex != null) {
    return !!fieldPath.match(validator.regex);
  } else {
    return validator.path === fieldPath;
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
