import { filter, get, range, set } from "../../../utils";
import { Atom } from "../../../utils/atoms";
import {
  createInitialValues,
  makeTouchedValues,
  makeUntouchedValues,
} from "../../helpers";
import { FormtsOptions } from "../../types/formts-options";
import { FormtsAction, FormtsState } from "../../types/formts-state";

export const getInitialState = <Values extends object, Err>({
  Schema,
  initialValues,
}: FormtsOptions<Values, Err>): Atom<FormtsState<Values, Err>> => {
  const values = createInitialValues(Schema, initialValues);
  const touched = makeUntouchedValues(values);

  return Atom.of({
    values,
    touched,
    errors: {},
    validating: {},
    isSubmitting: false,
  } as FormtsState<Values, Err>);
};


export const createStateDispatch = <Values extends object, Err>(stateAtom: Atom<FormtsState<Values, Err>>) =>
  (action: FormtsAction<Values, Err>) => {
    const state = stateAtom.val
    switch (action.type) {
      case "reset": {
        const { values } = action.payload;
        const touched = makeUntouchedValues(values);

        return stateAtom.set({
          values,
          touched,
          errors: {},
          validating: {},
          isSubmitting: false,
        });
      }

      case "touchValue": {
        const { path } = action.payload;

        const value = get(state.values, path);
        const touched = set(state.touched, path, makeTouchedValues(value));

        return stateAtom.set({ ...state, touched });
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

        return stateAtom.set({ ...state, values, touched, errors: resolveErrors() });
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

        return stateAtom.set({ ...state, errors });
      }

      case "validatingStart": {
        const { path, uuid } = action.payload;

        const validating = {
          ...state.validating,
          [path]: { ...state.validating[path], [uuid]: true as const },
       };

        return stateAtom.set({ ...state, validating });
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

        return stateAtom.set({ ...state, validating });
      }

      case "setIsSubmitting": {
        const { isSubmitting } = action.payload;
        return stateAtom.set({ ...state, isSubmitting });
      }
    }
  }