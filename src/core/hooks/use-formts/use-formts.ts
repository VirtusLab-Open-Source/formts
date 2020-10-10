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
import {
  isChoiceDecoder,
  _ChoiceFieldDecoderImpl,
} from "../../types/field-decoder";
import {
  FieldDescriptor,
  _FieldDescriptorImpl,
} from "../../types/field-descriptor";
import { FieldHandle, toFieldHandle } from "../../types/field-handle";
import { FieldHandleSchema } from "../../types/field-handle-schema";
import { FormHandle } from "../../types/form-handle";
import {
  FormSchema,
  GenericFormDescriptorSchema,
} from "../../types/form-schema";
import {
  isArrayDesc,
  isObjectDesc,
  objectDescriptorKeys,
  _DescriptorApprox_,
} from "../../types/form-schema-approx";
import { FormValidator } from "../../types/form-validator";
import { impl, opaque } from "../../types/type-mapper-util";

import { createInitialValues } from "./create-initial-values";
import { createReducer, getInitialState } from "./reducer";
import { resolveIsValid } from "./resolve-is-valid";
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
  form: Partial<FormHandle<Values, Err>> // TODO
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
    get(state.values, impl(field).path) as any;

  const getFieldError = (field: FieldDescriptor<any, Err>): Err | null => {
    const error = state.errors[impl(field).path];
    return error == null ? null : error;
  };

  const isFieldTouched = <T>(field: FieldDescriptor<T, Err>) =>
    resolveTouched(get(state.touched as object, impl(field).path));

  const isFieldValid = <T>(field: FieldDescriptor<T, Err>) =>
    resolveIsValid(state.errors, impl(field).path);

  const setField = <T>(field: FieldDescriptor<T, Err>, value: T): void => {
    const decodeResult = impl(field).decode(value);
    if (decodeResult.ok) {
      dispatch({
        type: "setValue",
        payload: { path: impl(field).path, value: decodeResult.value },
      });
    } else {
      logger.warn(
        `Field ${impl(field).path} received illegal value: ${JSON.stringify(
          value
        )}`
      );
    }
  };

  const touchField = <T, Err>(field: FieldDescriptor<T, Err>) =>
    dispatch({ type: "touchValue", payload: { path: impl(field).path } });

  const setFieldErrors = (
    ...fields: Array<{
      field: FieldDescriptor<unknown, Err>;
      error: Err | null;
    }>
  ) =>
    dispatch({
      type: "setErrors",
      payload: fields.map(it => ({
        path: impl(it.field).path,
        error: it.error,
      })),
    });

  /// FIELD HANDLE CREATOR
  const createFieldHandleNode = <T>(
    // TODO: consider flattening descriptors, so that `Schema.obj` -> root and `Schema.obj.prop` -> prop
    _descriptor: GenericFormDescriptorSchema<T, Err>
  ): FieldHandle<T, Err> => {
    const descriptor = (_descriptor as any) as _DescriptorApprox_<T>;
    const rootDescriptor =
      isArrayDesc(descriptor) || isObjectDesc(descriptor)
        ? descriptor.root
        : descriptor;

    return toFieldHandle({
      descriptor: opaque(rootDescriptor),

      id: rootDescriptor.path,

      get value() {
        return getField(opaque(rootDescriptor));
      },

      get isTouched() {
        return isFieldTouched(opaque(rootDescriptor));
      },

      get error() {
        return getFieldError(opaque(rootDescriptor));
      },

      get isValid() {
        return isFieldValid(opaque(rootDescriptor));
      },

      get children() {
        if (isObjectDesc(descriptor)) {
          return objectDescriptorKeys(descriptor).reduce(
            (acc, key) =>
              Object.defineProperty(acc, key, {
                enumerable: true,
                get: function () {
                  const nestedDescriptor = descriptor[key];
                  return createFieldHandleNode(nestedDescriptor as any);
                },
              }),
            {}
          );
        }

        if (isArrayDesc(descriptor)) {
          const value = (getField(opaque(rootDescriptor)) as any) as Array<
            unknown
          >;
          return value.map((_, idx) =>
            createFieldHandleNode(descriptor.nth(idx) as any)
          );
        }

        return undefined;
      },

      get options() {
        return isChoiceDecoder(descriptor)
          ? toIdentityDict(descriptor.options as string[])
          : undefined;
      },

      handleBlur: () => {
        touchField(opaque(rootDescriptor));
      },

      setValue: val => {
        setField(opaque(rootDescriptor), val);
      },

      setError: error => {
        setFieldErrors({ field: opaque(rootDescriptor), error });
      },
    });
  };

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

  // TODO
  const form: Partial<FormHandle<Values, Err>> = {
    values: state.values,

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

    reset: values => {
      dispatch({
        type: "reset",
        payload: { values: createInitialValues(options.Schema, values) },
      });
    },
  };

  return [fields, form];
};
