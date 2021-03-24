import { isFalsy } from "../../utils";
import { compact, flatMap, uniqBy } from "../../utils/array";
import { Task } from "../../utils/task";
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
    descriptor: FieldDescriptor<unknown, Err>,
    trigger?: ValidationTrigger
  ): FieldValidator<any, Err, any[]>[] => {
    return allValidators.filter(x => {
      const triggerMatches =
        trigger && x.triggers ? x.triggers.includes(trigger) : true;
      return triggerMatches && validatorMatchesField(x, descriptor);
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
          getChildrenDescriptors(x, getValue)
        );
        const dependents = flatMap(fields, x =>
          getDependents(x, dependenciesDict, getValue)
        );
        const parents = flatMap(fields, getParentsChain);

        const uniqueFields = uniqBy(
          [...allFields, ...dependents, ...parents],
          x => impl(x).__path
        );

        return uniqueFields
          .map(field => ({
            field,
            validators: getValidatorsForField(field, trigger),
          }))
          .filter(x => x.validators.length > 0);
      };

      return Task.from(resolveFieldsToValidate)
        .flatMap(fieldsToValidate =>
          Task.all(
            ...fieldsToValidate.map(({ field, validators }) => {
              const validationKey = FieldValidationKey.make(field, trigger);

              return Task.from(() => {
                onFieldValidationStart?.(field);
                ongoingValidationTimestamps[validationKey] = timestamp;
                return getValue(field);
              })
                .flatMap(value =>
                  firstNonNullTaskResult(
                    validators.map(v =>
                      debounceStepHandler(v, field).flatMap(() =>
                        runValidationForField(v, value, getValue)
                      )
                    )
                  )
                )
                .flatMapErr(err => {
                  if (err === true) {
                    return Task.success(null); // optional validator edge-case
                  }
                  onFieldValidationEnd?.(field);
                  return Task.failure(err);
                })
                .map(validationError => {
                  onFieldValidationEnd?.(field);

                  if (
                    ongoingValidationTimestamps[validationKey] === timestamp
                  ) {
                    delete ongoingValidationTimestamps[validationKey];
                    return { field, error: validationError };
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
      field: config.field,
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

const getChildrenDescriptors = <Err>(
  descriptor: FieldDescriptor<unknown, Err>,
  getValue: (field: FieldDescriptor<unknown, Err>) => unknown
): Array<FieldDescriptor<unknown, Err>> => {
  const root = [descriptor];

  if (isObjectDescriptor(descriptor)) {
    const children = getObjectDescriptorChildren(descriptor);
    return root.concat(
      flatMap(children, x => getChildrenDescriptors(x, getValue))
    );
  } else if (isArrayDescriptor(descriptor)) {
    const numberOfChildren = (getValue(descriptor) as any[])?.length;
    if (numberOfChildren === 0) {
      return root;
    }
    const children = getArrayDescriptorChildren(descriptor, numberOfChildren);
    return root.concat(
      flatMap(children, x =>
        getChildrenDescriptors(x as FieldDescriptor<unknown, Err>, getValue)
      )
    );
  } else {
    return root;
  }
};

type DependenciesDict<Err> = {
  [path: string]: ValidateField<unknown, Err>[];
};

const buildDependenciesDict = <Err>(
  validators: FieldValidator<any, Err, any>[]
): DependenciesDict<Err> => {
  let dict: DependenciesDict<Err> = {};

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

const getDependents = <Err>(
  desc: FieldDescriptor<any, Err>,
  dependenciesDict: DependenciesDict<Err>,
  getValue: GetValue<Err>
): FieldDescriptor<any, Err>[] =>
  flatMap(dependenciesDict[impl(desc).__path] ?? [], x => {
    if (isNth(x)) {
      const rootPath = impl(x).__rootPath;
      return getValue<any[]>(rootPath).map((_, i) => x(i));
    } else {
      return [x];
    }
  });

const getParentsChain = <Err>(
  desc: FieldDescriptor<any, Err>
): FieldDescriptor<any, Err>[] => {
  const parent = impl(desc).__parent;
  if (!parent) {
    return [];
  } else {
    const opaqueParent = opaque(parent) as FieldDescriptor<any, Err>;
    return [opaqueParent, ...getParentsChain(opaqueParent)];
  }
};

const getDependenciesValues = <Values extends readonly any[], Err>(
  deps: readonly [...FieldDescTuple<Values, Err>],
  getValue: GetValue<Err>
): Values => {
  return deps.map(x => getValue(x)) as any;
};

const validatorMatchesField = (
  validator: FieldValidator<any, any, any[]>,
  field: FieldDescriptor<any>
): boolean => {
  if (isNth(validator.field)) {
    const validatorRootPath = impl(validator.field).__rootPath;
    const fieldRootPath = impl(field).__parent?.__path;
    return validatorRootPath === fieldRootPath;
  } else {
    const validatorPath = impl(validator.field).__path;
    const fieldPath = impl(field).__path;
    return (
      validatorPath === fieldPath ||
      pathMatchesTemplatePath(fieldPath, validatorPath)
    );
  }
};

const pathMatchesTemplatePath = (path: string, template: string) => {
  if (!template.includes("[-ANY-]")) {
    return false;
  } else {
    const templateRegex = template
      .replace(new RegExp("\\.", "g"), "\\.")
      .replace(new RegExp("\\[", "g"), "\\[")
      .replace(new RegExp("\\]", "g"), "\\]")
      .replace(new RegExp("-ANY-", "g"), "(\\d+)");

    return !!path.match(new RegExp(templateRegex));
  }
};

type FieldValidationKey = string;
namespace FieldValidationKey {
  export const make = (
    field: FieldDescriptor<unknown>,
    trigger?: ValidationTrigger
  ): FieldValidationKey =>
    `${impl(field).__path}:t-${trigger ?? "none"}` as any;
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
    field: FieldDescriptor<unknown, unknown>
  ) => Task<void>;

  const CANCEL_ERR = "__CANCEL__";

  export const createDebounceStepHandler = (): DebounceStepHandler => {
    const debouncedValidations: DebouncedValidationsDict = {};

    return (v, field) =>
      Task.make(({ resolve, reject }) => {
        const id = `${v.id}-${impl(field).__path}`;
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
