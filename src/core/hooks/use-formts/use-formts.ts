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
import { TouchedValues } from "../../types/formts-state";
import { impl, opaqueDescriptor as opaque } from "../../types/type-mapper-util";

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

type TemporaryFormtsReturn<Values extends object, Err> = {
  fields: FieldHandleSchema<Values, Err>;
  values: Values;
  touched: TouchedValues<Values>;
  getField: <T, Err>(field: FieldDescriptor<T, Err>) => T;
  setField: <T, Err>(field: FieldDescriptor<T, Err>, value: T) => void;
  isTouched: <T, Err>(field: FieldDescriptor<T, Err>) => boolean;
  touchField: <T, Err>(field: FieldDescriptor<T, Err>) => void;
};

export const useFormts = <Values extends object, Err>(
  options: FormtsOptions<Values, Err>
): TemporaryFormtsReturn<Values, Err> => {
  const [state, dispatch] = React.useReducer(
    createReducer<Values>(),
    options,
    getInitialState
  );

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
          return objectDescriptorKeys(descriptor).reduce((acc, key) => {
            acc[key] = createFieldHandleNode((descriptor as any)[key]);
            return acc;
          }, {} as any);
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

      options: isChoiceDecoder(descriptor)
        ? toIdentityDict(descriptor.options as string[])
        : undefined,

      handleBlur: () => {
        touchField(opaque(rootDescriptor));
      },

      setValue: val => {
        setField(opaque(rootDescriptor), val);
      },
    });
  };

  const fields = keys(options.Schema).reduce((acc, key) => {
    (acc as any)[key] = createFieldHandleNode(options.Schema[key]);
    return acc;
  }, {} as FieldHandleSchema<Values, Err>);

  return { ...state, getField, setField, isTouched, touchField, fields };
};
