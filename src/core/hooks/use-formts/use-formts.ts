import React from "react";

import { DeepPartial, get, logger, toIdentityDict } from "../../../utils";
import {
  isArrayDecoder,
  isChoiceDecoder,
  isObjectDecoder,
  _ChoiceFieldDecoderImpl,
} from "../../types/field-decoder";
import {
  FieldDescriptor,
  _FieldDescriptorImpl,
} from "../../types/field-descriptor";
import { FieldHandle, toFieldHandle } from "../../types/field-handle";
import { FormSchema } from "../../types/form-schema";
import { TouchedValues } from "../../types/formts-state";
import { impl } from "../../types/type-mapper-util";

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

type TemporaryFormtsReturn<Values extends object> = {
  values: Values;
  touched: TouchedValues<Values>;
  getField: <T, Err>(field: FieldDescriptor<T, Err>) => T;
  setField: <T, Err>(field: FieldDescriptor<T, Err>, value: T) => void;
  isTouched: <T, Err>(field: FieldDescriptor<T, Err>) => boolean;
  touchField: <T, Err>(field: FieldDescriptor<T, Err>) => void;
};

export const useFormts = <Values extends object, Err>(
  options: FormtsOptions<Values, Err>
): TemporaryFormtsReturn<Values> => {
  const [state, dispatch] = React.useReducer(
    createReducer<Values>(),
    options,
    getInitialState
  );

  //

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

  //

  // TODO: call on top level descriptors from the Schema and return from the hook
  // @ts-ignore // unused
  const fieldHandle = <T, Err>(
    // TODO: do we need GenericFormDescriptorSchema<T, Err> here instead?
    // TODO: consider flattening descriptors, so that `Schema.obj` -> root and `Schema.obj.prop` -> prop
    descriptor: FieldDescriptor<T, Err>
  ): FieldHandle<T, Err> =>
    toFieldHandle({
      descriptor,

      id: impl(descriptor).path,

      get value() {
        return getField(descriptor);
      },

      get isTouched() {
        return isTouched(descriptor);
      },

      // by using getters we can lazily create field handles when needed instead of keeping them as part of state
      get children() {
        if (isObjectDecoder(descriptor)) {
          // we need access to child descriptors here (needed for recursive call),

          // maybe each key could be a getter fn with computed name for further laziness?
          return {}; // TODO
        }
        if (isArrayDecoder(descriptor)) {
          // same problem except we also need to look up values in state to create handle for each array item.
          // `nth` function for generating descriptors is needed for recursive call
          return []; // TODO
        }

        return undefined;
      },

      options: isChoiceDecoder(descriptor)
        ? toIdentityDict(descriptor.options as string[])
        : undefined,

      handleBlur: () => {
        touchField(descriptor);
      },

      setValue: val => {
        setField(descriptor, val);
      },
    });

  return { ...state, getField, setField, isTouched, touchField };
};
