import React from "react";

import {
  DeepPartial,
  entries,
  get,
  keys,
  logger,
  toIdentityDict,
  values,
} from "../../../utils";
import { isChoiceDecoder } from "../../types/field-decoder";
import {
  FieldDescriptor,
  isArrayDescriptor,
  isObjectDescriptor,
} from "../../types/field-descriptor";
import { FieldHandle, toFieldHandle } from "../../types/field-handle";
import { FieldHandleSchema } from "../../types/field-handle-schema";
import { FormHandle } from "../../types/form-handle";
import { FormSchema } from "../../types/form-schema";
import {
  FormValidator,
  ValidationResult,
  ValidationTrigger,
} from "../../types/form-validator";
import { impl } from "../../types/type-mapper-util";

import { createInitialValues } from "./create-initial-values";
import { createReducer, getInitialState } from "./reducer";
import { resolveIsValid } from "./resolve-is-valid";
import { resolveIsValidating } from "./resolve-is-validating";
import { resolveTouched } from "./resolve-touched";

export type FormtsOptions<Values extends object, Err> = {
  /** Definition of form fields created using `createForm.schema` function.  */
  Schema: FormSchema<Values, Err>;

  /**
   * Values used to override the defaults when filling the form
   * after the component is mounted or after form reset (optional).
   * The defaults depend on field type (defined in the Schema).
   */
  initialValues?: DeepPartial<Values>;

  /** Form validator created using `createForm.validator` function (optional). */
  validator?: FormValidator<Values, Err>;
};

type FormtsReturn<Values extends object, Err> = [
  fields: FieldHandleSchema<Values, Err>,
  form: FormHandle<Values, Err>
];

export const useFormts = <Values extends object, Err>(
  options: FormtsOptions<Values, Err>
): FormtsReturn<Values, Err> => {
  /// INTERNAL STATE
  const [state, dispatch] = React.useReducer(
    createReducer<Values, Err>(),
    options,
    getInitialState
  );

  /// INTERNAL HANDLERS
  const getField = <T>(field: FieldDescriptor<T, Err>): T =>
    get(state.values, impl(field).__path) as any;

  const getFieldError = (field: FieldDescriptor<any, Err>): Err | null => {
    const error = state.errors[impl(field).__path];
    return error == null ? null : error;
  };

  const isFieldTouched = <T>(field: FieldDescriptor<T, Err>) =>
    resolveTouched(get(state.touched as object, impl(field).__path));

  const isFieldValid = <T>(field: FieldDescriptor<T, Err>) =>
    resolveIsValid(state.errors, field);

  const isFieldValidating = <T>(field: FieldDescriptor<T, Err>) =>
    resolveIsValidating(state.validating, field);

  const makeValidationHandlers = () => {
    const uuid = new Date().valueOf().toString();
    return {
      onFieldValidationStart: (field: FieldDescriptor<unknown, Err>) => {
        dispatch({
          type: "validatingStart",
          payload: { path: impl(field).__path, uuid },
        });
      },
      onFieldValidationEnd: (field: FieldDescriptor<unknown, Err>) => {
        dispatch({
          type: "validatingStop",
          payload: { path: impl(field).__path, uuid },
        });
      },
    };
  };

  const validateField = <T>(
    field: FieldDescriptor<T, Err>,
    trigger?: ValidationTrigger
  ): Promise<void> => {
    if (!options.validator) {
      return Promise.resolve();
    }
    const {
      onFieldValidationStart,
      onFieldValidationEnd,
    } = makeValidationHandlers();

    return options.validator
      .validate({
        fields: [field],
        getValue: getField,
        trigger,
        onFieldValidationStart,
        onFieldValidationEnd,
      })
      .then(errors => {
        setFieldErrors(...errors);
      });
  };

  const validateForm = (): Promise<ValidationResult<Err>> => {
    if (options.validator == null) {
      return Promise.resolve([]);
    }
    const topLevelDescriptors = values(fields).map(it => it.descriptor);
    const {
      onFieldValidationStart,
      onFieldValidationEnd,
    } = makeValidationHandlers();

    return options.validator
      .validate({
        fields: topLevelDescriptors,
        getValue: getField,
        onFieldValidationStart,
        onFieldValidationEnd,
      })
      .then(errors => {
        setFieldErrors(...errors);
        return errors;
      });
  };

  const setField = <T>(
    field: FieldDescriptor<T, Err>,
    value: T
  ): Promise<void> => {
    const decodeResult = impl(field).__decoder.decode(value);
    if (!decodeResult.ok) {
      logger.warn(
        `Field ${impl(field).__path} received illegal value: ${JSON.stringify(
          value
        )}`
      );
      return Promise.resolve();
    }

    const validateAfterChange = () => {
      if (!options.validator) {
        return Promise.resolve();
      }

      // TODO: getField is problematic when relaying on useReducer, should be solved when Atom based state is implemented
      const modifiedGetField = <T>(
        fieldToValidate: FieldDescriptor<T, Err>
      ): T => {
        if (impl(field).__path === impl(fieldToValidate).__path) {
          return decodeResult.value as any;
        }
        return getField(fieldToValidate);
      };

      const {
        onFieldValidationStart,
        onFieldValidationEnd,
      } = makeValidationHandlers();

      return options.validator
        .validate({
          fields: [field],
          getValue: modifiedGetField,
          trigger: "change",
          onFieldValidationStart,
          onFieldValidationEnd,
        })
        .then(errors => {
          setFieldErrors(...errors);
        });
    };

    dispatch({
      type: "setValue",
      payload: { path: impl(field).__path, value: decodeResult.value },
    });
    return validateAfterChange();
  };

  const touchField = <T>(field: FieldDescriptor<T, Err>) =>
    dispatch({ type: "touchValue", payload: { path: impl(field).__path } });

  const setFieldErrors = (
    ...fields: Array<{
      field: FieldDescriptor<unknown, Err>;
      error: Err | null;
    }>
  ) =>
    dispatch({
      type: "setErrors",
      payload: fields.map(it => ({
        path: impl(it.field).__path,
        error: it.error,
      })),
    });

  /// FIELD HANDLE CREATOR
  const createFieldHandleNode = <T>(
    descriptor: FieldDescriptor<T, Err>
  ): FieldHandle<T, Err> =>
    toFieldHandle({
      descriptor,

      id: impl(descriptor).__path,

      get value() {
        return getField(descriptor);
      },

      get isTouched() {
        return isFieldTouched(descriptor);
      },

      get error() {
        return getFieldError(descriptor);
      },

      get isValid() {
        return isFieldValid(descriptor);
      },

      get isValidating() {
        return isFieldValidating(descriptor);
      },

      get children() {
        if (isObjectDescriptor(descriptor)) {
          return keys(descriptor).reduce(
            (acc, key) =>
              Object.defineProperty(acc, key, {
                enumerable: true,
                get: function () {
                  const nestedDescriptor = descriptor[key];
                  return createFieldHandleNode(nestedDescriptor);
                },
              }),
            {}
          );
        }

        if (isArrayDescriptor(descriptor)) {
          const value = getField(descriptor) as unknown[];
          return value.map((_, i) => createFieldHandleNode(descriptor.nth(i)));
        }

        return undefined;
      },

      get options() {
        const decoder = impl(descriptor).__decoder;
        return isChoiceDecoder(decoder)
          ? toIdentityDict(decoder.options as string[])
          : undefined;
      },

      handleBlur: () => {
        touchField(descriptor);
        return validateField(descriptor, "blur");
      },

      setValue: val => {
        return setField(descriptor, val);
      },

      setError: error => {
        setFieldErrors({ field: descriptor, error });
      },

      validate: () => {
        return validateField(descriptor);
      },
    });

  /// PUBLIC API
  const fields = keys(options.Schema).reduce(
    (acc, key) =>
      Object.defineProperty(acc, key, {
        enumerable: true,
        get: function () {
          const nestedDescriptor = options.Schema[key];
          return createFieldHandleNode(nestedDescriptor);
        },
      }),
    {} as FieldHandleSchema<Values, Err>
  );

  const form: FormHandle<Values, Err> = {
    values: state.values,

    isSubmitting: state.isSubmitting,

    get errors() {
      return entries(state.errors)
        .filter(([, err]) => err != null)
        .map(([path, error]) => ({ path, error: error! }));
    },

    get isTouched() {
      return resolveTouched(state.touched);
    },

    get isValid() {
      return values(state.errors).filter(err => err != null).length === 0;
    },

    get isValidating() {
      return keys(state.validating).length > 0;
    },

    validate: () => {
      return validateForm();
    },

    reset: () => {
      dispatch({
        type: "reset",
        payload: {
          values: createInitialValues(options.Schema, options.initialValues),
        },
      });
    },

    getSubmitHandler: (onSuccess, onFailure) => event => {
      event?.preventDefault();
      dispatch({ type: "setIsSubmitting", payload: { isSubmitting: true } });

      const clearSubmitting = () =>
        dispatch({
          type: "setIsSubmitting",
          payload: { isSubmitting: false },
        });

      return validateForm()
        .then(errors =>
          errors
            .filter(({ error }) => error != null)
            .map(({ field, error }) => ({
              path: impl(field).__path,
              error: error!,
            }))
        )
        .then(errors => {
          if (errors.length > 0) {
            clearSubmitting();
            onFailure?.(errors);
          } else {
            return Promise.resolve(onSuccess(state.values))
              .then(clearSubmitting)
              .catch(err => {
                clearSubmitting();
                throw err;
              });
          }
        });
    },
  };

  return [fields, form];
};
