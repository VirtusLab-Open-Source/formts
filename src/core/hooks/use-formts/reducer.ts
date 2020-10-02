import { Reducer } from "react";

import { set } from "../../../utils";
import { FormtsState } from "../../types/formts-state";

import { FormtsAction } from "./actions";
import { createInitialTouched } from "./create-initial-touched";
import { createInitialValues } from "./create-initial-values";
import { FormtsOptions } from "./use-formts";

// TODO testme
export const createReducer = <Values extends object>(): Reducer<
  FormtsState<Values>,
  FormtsAction<Values>
> => (state, action) => {
  switch (action.type) {
    case "setValues":
      return { ...state, values: action.payload.values };

    case "setTouched":
      return { ...state, touched: action.payload.touched };

    case "updateValue": {
      const values = set(
        state.values,
        action.payload.path,
        action.payload.value
      );

      // TODO: handle non-primitive values
      const touched = set(state.touched as object, action.payload.path, true);

      return { values, touched };
    }
  }
};

export const getInitialState = <Values extends object>({
  Schema,
  initialValues,
}: FormtsOptions<Values, any>): FormtsState<Values> => {
  const values = createInitialValues(Schema, initialValues);
  const touched = createInitialTouched(values);
  return { values, touched };
};
