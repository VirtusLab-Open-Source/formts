import { Reducer } from "react";

import { get, set } from "../../../utils";
import { FormtsState } from "../../types/formts-state";

import { createInitialValues } from "./create-initial-values";
import { makeTouchedValues, makeUntouchedValues } from "./make-touched-values";
import { FormtsOptions } from "./use-formts";

export type FormtsAction<Values, Err> =
  | { type: "reset"; payload: { values: Values } }
  | { type: "touchValue"; payload: { path: string } }
  | { type: "setValue"; payload: { path: string; value: any } }
  | { type: "setErrors"; payload: Array<{ path: string; error: Err | null }> }
  | { type: "setIsSubmitting"; payload: { isSubmitting: boolean } };

export const createReducer = <Values extends object, Err>(): Reducer<
  FormtsState<Values, Err>,
  FormtsAction<Values, Err>
> => (state, action) => {
  switch (action.type) {
    case "reset": {
      const { values } = action.payload;
      const touched = makeUntouchedValues(values);

      return {
        values,
        touched,
        errors: {},
        isSubmitting: false,
      };
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

      return { ...state, values, touched };
    }

    case "setErrors": {
      const errors = action.payload.reduce(
        (dict, { path, error }) => {
          if (error != null) {
            dict[path] = error;
          } else {
            delete dict[path];
          }
          return dict;
        },
        { ...state.errors }
      );

      return { ...state, errors };
    }

    case "setIsSubmitting": {
      const { isSubmitting } = action.payload;
      return { ...state, isSubmitting };
    }
  }
};

export const getInitialState = <Values extends object, Err>({
  Schema,
  initialValues,
}: FormtsOptions<Values, any>): FormtsState<Values, Err> => {
  const values = createInitialValues(Schema, initialValues);
  const touched = makeUntouchedValues(values);

  return {
    values,
    touched,
    errors: {},
    isSubmitting: false,
  };
};
