import React from "react";

import { get, logger, values } from "../../../utils";
import {
  createInitialValues,
  makeValidationHandlers,
  resolveIsValid,
  resolveIsValidating,
  resolveTouched,
} from "../../helpers";
import { FieldDescriptor } from "../../types/field-descriptor";
import { FormSchema } from "../../types/form-schema";
import {
  ValidationResult,
  ValidationTrigger,
} from "../../types/form-validator";
import {
  FormSubmissionResult,
  InternalFormtsMethods,
} from "../../types/formts-context";
import { FormtsOptions } from "../../types/formts-options";
import { FormtsAction, FormtsState } from "../../types/formts-state";
import { impl } from "../../types/type-mapper-util";

type Input<Values extends object, Err> = {
  Schema: FormSchema<Values, Err>;
  options: FormtsOptions<Values, Err>;
  state: FormtsState<Values, Err>;
  dispatch: React.Dispatch<FormtsAction<Values, Err>>;
};

export const createFormtsMethods = <Values extends object, Err>({
  Schema,
  options,
  state,
  dispatch,
}: Input<Values, Err>): InternalFormtsMethods<Values, Err> => {
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
    } = makeValidationHandlers(dispatch);

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
    const topLevelDescriptors = values(Schema);
    const {
      onFieldValidationStart,
      onFieldValidationEnd,
    } = makeValidationHandlers(dispatch);

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

  const setFieldValue = <T>(
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
      } = makeValidationHandlers(dispatch);

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

  const resetForm = () => {
    dispatch({
      type: "reset",
      payload: {
        values: createInitialValues(Schema, options.initialValues),
      },
    });
  };

  const submitForm = (): Promise<FormSubmissionResult<Values, Err>> => {
    dispatch({ type: "setIsSubmitting", payload: { isSubmitting: true } });

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
          return { ok: false, errors } as const;
        }

        return { ok: true, values: state.values } as const;
      })
      .then(result => {
        dispatch({
          type: "setIsSubmitting",
          payload: { isSubmitting: false },
        });

        return result;
      });
  };

  return {
    getField,
    getFieldError,
    isFieldTouched,
    isFieldValid,
    isFieldValidating,
    validateField,
    validateForm,
    setFieldValue,
    touchField,
    setFieldErrors,
    resetForm,
    submitForm,
  };
};
