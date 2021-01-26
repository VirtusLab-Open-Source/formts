import { filter, get, range, set } from "../../../utils";
import { Atom } from "../../../utils/atoms";
import {
  createInitialValues,
  makeTouchedValues,
  makeUntouchedValues,
} from "../../helpers";
import { FormtsOptions } from "../../types/formts-options";
import { FormtsAction, FormtsAtomState } from "../../types/formts-state";

export const getInitialState = <Values extends object, Err>({
  Schema,
  initialValues,
}: FormtsOptions<Values, Err>): FormtsAtomState<Values, Err> => {
  const values = createInitialValues(Schema, initialValues);
  const touched = makeUntouchedValues(values);

  return {
    values: Atom.of(values),
    touched: Atom.of(touched),
    errors: Atom.of({}),
    validating: Atom.of({}),
    isSubmitting: Atom.of<boolean>(false),
  };
};

export const createStateDispatch = <Values extends object, Err>(
  stateAtom: FormtsAtomState<Values, Err>
) => (action: FormtsAction<Values, Err>) => {
  const state = {
    values: stateAtom.values.val,
    touched: stateAtom.touched.val,
    errors: stateAtom.errors.val,
    validating: stateAtom.validating.val,
    isSubmitting: stateAtom.validating.val,
  };

  switch (action.type) {
    case "reset": {
      const { values } = action.payload;
      const touched = makeUntouchedValues(values);

      stateAtom.values.set(values);
      stateAtom.touched.set(touched);
      stateAtom.errors.set({});
      stateAtom.validating.set({});
      stateAtom.isSubmitting.set(false);
      break;
    }

    case "touchValue": {
      const { path } = action.payload;

      const value = get(state.values, path);
      const touched = set(state.touched, path, makeTouchedValues(value));

      stateAtom.touched.set(touched);
      break;
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

      stateAtom.values.set(values);
      stateAtom.touched.set(touched);
      stateAtom.errors.set(resolveErrors());
      break;
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

      stateAtom.errors.set(errors);
      break;
    }

    case "validatingStart": {
      const { path, uuid } = action.payload;

      const validating = {
        ...state.validating,
        [path]: { ...state.validating[path], [uuid]: true as const },
      };

      stateAtom.validating.set(validating);
      break;
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

      stateAtom.validating.set(validating);
      break;
    }

    case "setIsSubmitting": {
      const { isSubmitting } = action.payload;
      return stateAtom.isSubmitting.set(isSubmitting);
    }
  }
};
