import { Falsy, NoInfer } from "../../../utils";
import {
  createRegexForTemplate,
  pathIsTemplate,
} from "../../types/field-template";
import {
  FieldPath,
  ValidationTrigger,
  Validator,
} from "../../types/form-validator";
import { impl } from "../../types/type-mapper-util";

import {
  FieldDescTuple,
  ValidateConfig,
  ValidationFieldPointer,
} from "./form-validator-builder";

export type FieldValidator<T, Err, Dependencies extends any[]> = {
  id: string;
  path: FieldPath;
  triggers?: Array<ValidationTrigger>;
  validators: (...deps: [...Dependencies]) => Array<Falsy | Validator<T, Err>>;
  dependencies?: readonly [...FieldDescTuple<Dependencies, Err>];
  debounce?: number;
  regex?: RegExp;
};

export type CreateFieldValidatorFn = {
  <T, Err, Dependencies extends any[]>(
    config: ValidateConfig<T, Err, Dependencies>
  ): FieldValidator<T, Err, Dependencies>;

  <T, Err>(
    field: ValidationFieldPointer<T, Err>,
    ...rules: Array<Validator<T, NoInfer<Err>>>
  ): FieldValidator<T, Err, []>;
};

export const createFieldValidator: CreateFieldValidatorFn = <
  T,
  Err,
  Deps extends any[]
>(
  x: ValidateConfig<T, Err, Deps> | ValidationFieldPointer<T, Err>,
  ...rules: Array<Validator<T, Err>>
): FieldValidator<T, Err, Deps> => {
  const config: ValidateConfig<T, Err, Deps> =
    (x as any)["field"] != null
      ? { ...(x as ValidateConfig<T, Err, Deps>) }
      : { field: x as ValidationFieldPointer<T, Err>, rules: () => rules };

  const path = impl(config.field).__path;
  const regex = pathIsTemplate(path) ? createRegexForTemplate(path) : undefined;

  return {
    id: getUuid(),
    path,
    regex,
    triggers: config.triggers,
    validators: config.rules,
    dependencies: config.dependencies,
    debounce: config.debounce,
  };
};

const getUuid = (() => {
  let index = 0;
  return () => (index++).toString();
})();
