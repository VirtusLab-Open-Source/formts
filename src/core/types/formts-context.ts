import { ChangeEvent } from "react";

import { Task } from "../../utils/task";
import type {
  FieldStateAtomCache,
  FieldDependenciesAtomCache,
} from "../hooks/use-form-controller/atom-cache";

import { FieldDescriptor } from "./field-descriptor";
import { FieldError } from "./form-handle";
import { ValidationResult, ValidationTrigger } from "./form-validator";
import { FormtsOptions } from "./formts-options";
import { FormtsAtomState, InitialValues } from "./formts-state";

export type InternalFormtsMethods<Values extends object, Err> = {
  validateField: <T>(
    field: FieldDescriptor<T, Err>,
    trigger?: ValidationTrigger
  ) => Task<void>;
  validateForm: () => Task<ValidationResult<Err>>;
  setFieldValue: <T>(field: FieldDescriptor<T, Err>, value: T) => Task<void>;
  setFieldValueFromEvent: <T>(
    field: FieldDescriptor<T, Err>,
    event: ChangeEvent<unknown>
  ) => Task<void>;
  setFieldTouched: <T>(
    field: FieldDescriptor<T, Err>,
    touched: boolean
  ) => Task<void>;
  setFieldErrors: (...fields: ValidationResult<Err>) => Task<void>;
  resetForm: (newInitialValues?: InitialValues<Values>) => Task<void>;
  resetField: <T>(field: FieldDescriptor<T, Err>) => Task<void>;
  submitForm: (
    onSuccess: (values: Values) => Task<void>,
    onFailure: (errors: Array<FieldError<Err>>) => Task<void>
  ) => Task<void>;
};

// internal context consumed by hooks
export type InternalFormtsContext<Values extends object, Err> = {
  options: FormtsOptions<Values, Err>;
  state: FormtsAtomState<Values, Err>;
  methods: InternalFormtsMethods<Values, Err>;
  fieldStateCache: FieldStateAtomCache<Values, Err>;
  fieldDependenciesCache: FieldDependenciesAtomCache<Values, Err>;
};
