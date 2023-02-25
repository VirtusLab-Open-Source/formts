import React from "react";

import { get, logger, values } from "../../../utils";
import { Task } from "../../../utils/task";
import * as Helpers from "../../helpers";
import { FieldDescriptor } from "../../types/field-descriptor";
import { FieldError } from "../../types/form-handle";
import {
  ValidationResult,
  ValidationTrigger,
} from "../../types/form-validator";
import { InternalFormtsMethods } from "../../types/formts-context";
import { FormtsOptions } from "../../types/formts-options";
import {
  FormtsAction,
  FormtsAtomState,
  InitialValues,
} from "../../types/formts-state";
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
  ): Task<void> => {
    return _runValidation([field], trigger).map(it => void it);
  };

  const validateForm = (
    trigger?: ValidationTrigger
  ): Task<ValidationResult<Err>> => {
    const topLevelDescriptors = values(options.Schema);
    return _runValidation(topLevelDescriptors, trigger);
  };

  const _runValidation = (
    fields: Array<FieldDescriptor<unknown, Err>>,
    trigger?: ValidationTrigger
  ): Task<ValidationResult<Err>, unknown> => {
    if (options.validator == null) {
      return Task.success([]);
    }
    const {
      onFieldValidationStart,
      onFieldValidationEnd,
      flushValidationHandlers,
    } = Helpers.makeValidationHandlers(dispatch);

    const validationTask = impl(options.validator)
      .validate({
        fields,
        trigger,
        getValue: getField,
        onFieldValidationStart,
        onFieldValidationEnd,
      })
      .flatMap(errors => setFieldErrors(...errors).map(() => errors));

    return Task.all(validationTask, Task.from(flushValidationHandlers)).map(
      ([validationResult]) => validationResult
    );
  };

  const setFieldValue = <T>(
    field: FieldDescriptor<T, Err>,
    value: T
  ): Task<void> => {
    if (state.isSubmitting.val) {
      return Task.success();
    }

    const { __decoder, __path } = impl(field);
    const decodeResult = __decoder.decode(value);

    if (!decodeResult.ok) {
      logger.warn(
        `Can not set field value for: '${__path}' [${__decoder.fieldType}] - illegal value type.`,
        value
      );
      return Task.success();
    }

    return _setDecodedFieldValue(field, decodeResult.value);
  };

  const setFieldValueFromEvent = <T>(
    field: FieldDescriptor<T, Err>,
    event: React.ChangeEvent<unknown>
  ): Task<void> => {
    if (state.isSubmitting.val) {
      return Task.success();
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
      return Task.success(undefined);
    }

    return _setDecodedFieldValue(field, decodeResult.value);
  };

  const _setDecodedFieldValue = <T>(
    field: FieldDescriptor<T, Err>,
    value: T
  ): Task<void> => {
    dispatch({ type: "setValue", payload: { field, value } });

    return validateField(field, "change");
  };

  const setFieldTouched = <T>(
    field: FieldDescriptor<T, Err>,
    touched: boolean
  ): Task<void> =>
    Task.from(() =>
      dispatch({ type: "setTouched", payload: { field, touched } })
    );

  const setFieldErrors = (
    ...fields: Array<{
      path: string;
      error: Err | null;
    }>
  ): Task<void> =>
    Task.from(() =>
      dispatch({
        type: "setErrors",
        payload: fields,
      })
    );

  const resetForm = (newInitialValues?: InitialValues<Values>): Task<void> =>
    Task.from(() =>
      dispatch({ type: "resetForm", payload: { newInitialValues } })
    );

  const resetField = <T>(field: FieldDescriptor<T, Err>): Task<void> =>
    Task.from(() => dispatch({ type: "resetField", payload: { field } }));

  const submitForm = (
    onSuccess: (values: Values) => Task<void>,
    onFailure: (errors: Array<FieldError<Err>>) => Task<void>
  ): Task<void> => {
    dispatch({ type: "submitStart" });

    return validateForm("submit")
      .map(errors =>
        errors
          .filter(({ error }) => error != null)
          .map(it => ({ error: it.error!, fieldId: it.path }))
      )
      .flatMap(errors => {
        if (errors.length > 0) {
          dispatch({ type: "submitFailure" });
          return onFailure(errors);
        } else {
          return onSuccess(state.values.val).map(() => {
            dispatch({ type: "submitSuccess" });
          });
        }
      })
      .mapErr(err => {
        dispatch({ type: "submitFailure" });
        return err;
      });
  };

  return {
    validateField,
    validateForm,
    setFieldValue,
    setFieldValueFromEvent,
    setFieldTouched,
    setFieldErrors,
    resetForm,
    resetField,
    submitForm,
  };
};
