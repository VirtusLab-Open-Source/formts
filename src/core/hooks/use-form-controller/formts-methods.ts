import React from "react";

import { get, logger, values } from "../../../utils";
import { Future } from "../../../utils/future";
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
    return typeof field === "string"
      ? get(state.values.val, field)
      : impl(field).__lens.get(state.values.val);
  };

  const validateField = <T>(
    field: FieldDescriptor<T, Err>,
    trigger?: ValidationTrigger
  ): Future<void> => {
    return _runValidation([field], trigger).map(it => void it);
  };

  const validateForm = (
    trigger?: ValidationTrigger
  ): Future<ValidationResult<Err>> => {
    const topLevelDescriptors = values(options.Schema);
    return _runValidation(topLevelDescriptors, trigger);
  };

  const _runValidation = (
    fields: Array<FieldDescriptor<unknown, Err>>,
    trigger?: ValidationTrigger
  ): Future<ValidationResult<Err>, unknown> => {
    if (options.validator == null) {
      return Future.success([]);
    }
    const {
      onFieldValidationStart,
      onFieldValidationEnd,
      flushValidationHandlers,
    } = Helpers.makeValidationHandlers(dispatch);

    const validationFuture = options.validator
      .validate({
        fields,
        trigger,
        getValue: getField,
        onFieldValidationStart,
        onFieldValidationEnd,
      })
      .map(errors => {
        setFieldErrors(...errors);
        return errors;
      });

    return Future.all(
      validationFuture,
      Future.from(flushValidationHandlers)
    ).map(([validationResult]) => validationResult);
  };

  const setFieldValue = <T>(
    field: FieldDescriptor<T, Err>,
    value: T
  ): Future<void> => {
    if (state.isSubmitting.val) {
      return Future.success();
    }

    const { __decoder, __path } = impl(field);
    const decodeResult = __decoder.decode(value);

    if (!decodeResult.ok) {
      logger.warn(
        `Can not set field value for: '${__path}' [${__decoder.fieldType}] - illegal value type.`,
        value
      );
      return Future.success();
    }

    return _setDecodedFieldValue(field, decodeResult.value);
  };

  const setFieldValueFromEvent = <T>(
    field: FieldDescriptor<T, Err>,
    event: React.ChangeEvent<unknown>
  ): Future<void> => {
    if (state.isSubmitting.val) {
      return Future.success();
    }

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
      return Future.success(undefined);
    }

    return _setDecodedFieldValue(field, decodeResult.value);
  };

  const _setDecodedFieldValue = <T>(
    field: FieldDescriptor<T, Err>,
    value: T
  ): Future<void> => {
    dispatch({ type: "setValue", payload: { field, value } });

    return validateField(field, "change");
  };

  const touchField = <T>(field: FieldDescriptor<T, Err>) =>
    dispatch({ type: "touchValue", payload: { field } });

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

  const submitForm = (): Future<FormSubmissionResult<Values, Err>> => {
    dispatch({ type: "setIsSubmitting", payload: { isSubmitting: true } });

    const cleanup = () => {
      dispatch({
        type: "setIsSubmitting",
        payload: { isSubmitting: false },
      });
    };

    return validateForm("submit")
      .map(errors =>
        errors
          .filter(({ error }) => error != null)
          .map(({ field, error }) => ({
            path: impl(field).__path,
            error: error!,
          }))
      )
      .map(errors => {
        if (errors.length > 0) {
          return { ok: false, errors } as const;
        }

        return { ok: true, values: state.values.val } as const;
      })
      .map(result => {
        cleanup();
        return result;
      })
      .mapErr(err => {
        cleanup();
        return err;
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
