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

type TmpFormtsReturn<Values extends object> = {
  values: Values;
  touched: TouchedValues<Values>;
  getField: <T, Err>(desc: FieldDescriptor<T, Err>) => T;
  setField: <T, Err>(desc: FieldDescriptor<T, Err>, value: T) => void;
};

// TODO fix tests
export const useFormts = <Values extends object, Err>(
  options: FormtsOptions<Values, Err>
): TmpFormtsReturn<Values> => {
  const [state, dispatch] = React.useReducer(
    createReducer<Values>(),
    options,
    getInitialState
  );

  const getField = <T, Err>(desc: FieldDescriptor<T, Err>): T =>
    get(state.values, impl(desc).path) as any;

  const setField = <T, Err>(desc: FieldDescriptor<T, Err>, value: T): void =>
    dispatch({
      type: "updateValue",
      payload: { path: impl(desc).path, value },
    });

  return { ...state, getField, setField };
};
