import { Reducer } from "react";

import { filter, get, range, set } from "../../../utils";
import { FormtsState } from "../../types/formts-state";

import { createInitialValues } from "./create-initial-values";
import { makeTouchedValues, makeUntouchedValues } from "./make-touched-values";
import { FormtsOptions } from "./use-formts";

export type FormtsAction<Values, Err> =
  | { type: "reset"; payload: { values: Values } }
  | { type: "touchValue"; payload: { path: string } }
  | { type: "setValue"; payload: { path: string; value: any } }
  | { type: "setErrors"; payload: Array<{ path: string; error: Err | null }> }
  | { type: "validatingStart"; payload: { path: string; uuid: string } }
  | { type: "validatingStop"; payload: { path: string; uuid: string } }
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
        validating: {},
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

      const resolveErrors = () => {
        if (!Array.isArray(value)) {
          return state.errors;
        }

        const currentValue = get(state.values, path) as unknown[];
        if (currentValue.length <= value.length) {
          return state.errors;
        }

        const hangingIndexes = range(value.length, currentValue.length - 1);
        const errors = filter(
          state.errors,
          ({ key }) =>
            !hangingIndexes.some(i => key.startsWith(`${path}[${i}]`))
        );

        return errors;
      };

      const values = set(state.values, path, value);
      const touched = set(state.touched, path, makeTouchedValues(value));

      return { ...state, values, touched, errors: resolveErrors() };
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

    case "validatingStart": {
      const { path, uuid } = action.payload;

      const validating = {
        ...state.validating,
        [path]: { ...state.validating[path], [uuid]: true as const },
      };

      return { ...state, validating };
    }

    case "validatingStop": {
      const { path, uuid } = action.payload;

      const validating = (() => {
        if (state.validating[path] == null) {
          return state.validating;
        }

        const validating = { ...state.validating };
        const uuids = { ...validating[path] };
        validating[path] = uuids;

        delete uuids[uuid];

        if (Object.keys(uuids).length === 0) {
          delete validating[path];
        }

        return validating;
      })();

      return { ...state, validating };
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
    validating: {},
    isSubmitting: false,
  };
};
