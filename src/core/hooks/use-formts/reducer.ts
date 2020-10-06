import { Reducer } from "react";

import { get, set } from "../../../utils";
import { FormtsState } from "../../types/formts-state";

import { createInitialValues } from "./create-initial-values";
import { makeTouchedValues, makeUntouchedValues } from "./make-touched-values";
import { FormtsOptions } from "./use-formts";

export type FormtsAction<Values> =
  | { type: "reset"; payload: { values: Values } }
  | { type: "touchValue"; payload: { path: string } }
  | { type: "setValue"; payload: { path: string; value: any } };

export const createReducer = <Values extends object>(): Reducer<
  FormtsState<Values>,
  FormtsAction<Values>
> => (state, action) => {
  switch (action.type) {
    case "reset": {
      const { values } = action.payload;

      const touched = makeUntouchedValues(values);

      return { values, touched };
    }

    case "touchValue": {
      const { path } = action.payload;

      const value = get(state.values, path);
      const touched = set(state.touched, path, makeTouchedValues(value));

      return { ...state, touched };
    }

    case "setValue": {
      const { path, value } = action.payload;

      const values = set(state.values, path, value);
      const touched = set(state.touched, path, makeTouchedValues(value));

      return { values, touched };
    }
  }
};

export const getInitialState = <Values extends object>({
  Schema,
  initialValues,
}: FormtsOptions<Values, any>): FormtsState<Values> => {
  const values = createInitialValues(Schema, initialValues);
  const touched = makeUntouchedValues(values);
  return { values, touched };
};
