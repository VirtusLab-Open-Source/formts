import React from "react";

import { get, logger, values } from "../../../utils";
import * as Helpers from "../../helpers";
import { FieldDescriptor } from "../../types/field-descriptor";
import {
  ValidationResult,
  ValidationTrigger,
} from "../../types/form-validator";
import {
  FormSubmissionResult,
  InternalFormtsMethods,
} from "../../types/formts-context";
import { FormtsOptions } from "../../types/formts-options";
import { FormtsAction, FormtsAtomState } from "../../types/formts-state";
import { impl } from "../../types/type-mapper-util";

type Input<Values extends object, Err> = {
  options: FormtsOptions<Values, Err>;
  state: FormtsAtomState<Values, Err>;
  dispatch: React.Dispatch<FormtsAction<Values, Err>>;
};

export const createFormtsMethods = <Values extends object, Err>({
  options,
  state,
  dispatch,
}: Input<Values, Err>): InternalFormtsMethods<Values, Err> => {
  const getField = <T>(field: FieldDescriptor<T, Err> | string): T => {
    const path = typeof field === "string" ? field : impl(field).__path;
    return get(state.values.val, path) as any;
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
    } = Helpers.makeValidationHandlers(dispatch);

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
    const topLevelDescriptors = values(options.Schema);
    const {
      onFieldValidationStart,
      onFieldValidationEnd,
    } = Helpers.makeValidationHandlers(dispatch);

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
    const { __decoder, __path } = impl(field);
    const decodeResult = __decoder.decode(value);

    if (!decodeResult.ok) {
      logger.warn(
        `Can not set field value for: '${__path}' [${__decoder.fieldType}] - illegal value type.`,
        value
      );
      return Promise.resolve();
    }

    return _setDecodedFieldValue(field, decodeResult.value);
  };

  const setFieldValueFromEvent = <T>(
    field: FieldDescriptor<T, Err>,
    event: React.ChangeEvent<unknown>
  ) => {
    const { __decoder, __path } = impl(field);
    const decodeResult = Helpers.decodeChangeEvent({
      event,
      fieldDecoder: __decoder,
      getValue: () => getField(field),
    });

    if (!decodeResult.ok) {
      logger.warn(
        `Can not set field value for: '${__path}' [${__decoder.fieldType}] - failed to extract valid value from event.target.`,
        event?.target
      );
      return Promise.resolve();
    }

    return _setDecodedFieldValue(field, decodeResult.value);
  };

  const _setDecodedFieldValue = <T>(
    field: FieldDescriptor<T, Err>,
    value: T
  ): Promise<void> => {
    const validateAfterChange = () => {
      if (!options.validator) {
        return Promise.resolve();
      }

      // TODO: getField is problematic when relaying on useReducer, should be solved when Atom based state is implemented
      const modifiedGetField = <T>(
        fieldToValidate: FieldDescriptor<T, Err> | string
      ): T => {
        const path =
          typeof fieldToValidate === "string"
            ? fieldToValidate
            : impl(fieldToValidate).__path;
        if (impl(field).__path === path) {
          return value as any;
        }
        return getField(fieldToValidate);
      };

      const {
        onFieldValidationStart,
        onFieldValidationEnd,
      } = Helpers.makeValidationHandlers(dispatch);

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
      payload: { path: impl(field).__path, value },
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
        values: Helpers.createInitialValues(
          options.Schema,
          options.initialValues
        ),
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

        return { ok: true, values: state.values.val } as const;
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
    validateField,
    validateForm,
    setFieldValue,
    setFieldValueFromEvent,
    touchField,
    setFieldErrors,
    resetForm,
    submitForm,
  };
};
