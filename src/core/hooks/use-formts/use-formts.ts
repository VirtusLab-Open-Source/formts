import React from "react";

import { DeepPartial, get } from "../../../utils";
import {
  FieldDescriptor,
  _FieldDescriptorImpl,
} from "../../types/field-descriptor";
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

  const getField = <T, Err>(field: FieldDescriptor<T, Err>): T =>
    get(state.values, impl(field).path) as any;

  const isTouched = <T, Err>(field: FieldDescriptor<T, Err>) =>
    resolveTouched(get(state.touched as object, impl(field).path));

  const setField = <T, Err>(field: FieldDescriptor<T, Err>, value: T): void =>
    dispatch({ type: "setValue", payload: { path: impl(field).path, value } });

  const touchField = <T, Err>(field: FieldDescriptor<T, Err>) =>
    dispatch({ type: "touchValue", payload: { path: impl(field).path } });

  return { ...state, getField, setField, isTouched, touchField };
};
