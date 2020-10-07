import React from "react";

import { DeepPartial, get, keys, logger, toIdentityDict } from "../../../utils";
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
import { impl, opaque } from "../../types/type-mapper-util";

import { createInitialValues } from "./create-initial-values";
import { createReducer, getInitialState } from "./reducer";
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
    createReducer<Values>(),
    options,
    getInitialState
  );

  /// INTERNAL HANDLERS
  const getField = <T, Err>(field: FieldDescriptor<T, Err>): T =>
    get(state.values, impl(field).path) as any;

  const isTouched = <T, Err>(field: FieldDescriptor<T, Err>) =>
    resolveTouched(get(state.touched as object, impl(field).path));

  const touchField = <T, Err>(field: FieldDescriptor<T, Err>) =>
    dispatch({ type: "touchValue", payload: { path: impl(field).path } });

  const setField = <T, Err>(field: FieldDescriptor<T, Err>, value: T): void => {
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

  /// FIELD HANDLE CREATOR
  const createFieldHandleNode = <T, Err>(
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
        return isTouched(opaque(rootDescriptor));
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

    get isTouched() {
      return resolveTouched(state.touched);
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
