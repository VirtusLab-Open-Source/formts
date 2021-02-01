import { filter, range } from "../../../utils";
import { Atom } from "../../../utils/atoms";
import {
  createInitialValues,
  makeTouchedValues,
  makeUntouchedValues,
} from "../../helpers";
import { FormtsOptions } from "../../types/formts-options";
import { FormtsAction, FormtsAtomState } from "../../types/formts-state";
import { impl } from "../../types/type-mapper-util";

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
  state: FormtsAtomState<Values, Err>
) => (action: FormtsAction<Values, Err>) => {
  switch (action.type) {
    case "reset": {
      const { values } = action.payload;
      const touched = makeUntouchedValues(values);

      state.values.set(values);
      state.touched.set(touched);
      state.errors.set({});
      state.validating.set({});
      state.isSubmitting.set(false);
      break;
    }

    case "touchValue": {
      const lens = impl(action.payload.field).__lens;

      const value = lens.get(state.values.val);
      const touched = lens.update(state.touched.val, () =>
        makeTouchedValues(value)
      );

      state.touched.set(touched);
      break;
    }

    case "setValue": {
      const { field, value } = action.payload;
      const lens = impl(field).__lens;
      const path = impl(field).__path;

      const resolveErrors = () => {
        if (!Array.isArray(value)) {
          return state.errors.val;
        }

        const currentValue = lens.get(state.values.val) as unknown[];

        if (currentValue.length <= value.length) {
          return state.errors.val;
        }

        const hangingIndexes = range(value.length, currentValue.length - 1);
        const errors = filter(
          state.errors.val,
          ({ key }) =>
            !hangingIndexes.some(i => key.startsWith(`${path}[${i}]`))
        );

        return errors;
      };

      const values = lens.update(state.values.val, () => value);
      const touched = lens.update(state.touched.val, () =>
        makeTouchedValues(value)
      );

      state.errors.set(resolveErrors());
      state.values.set(values);
      state.touched.set(touched);
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
        { ...state.errors.val }
      );

      state.errors.set(errors);
      break;
    }

    case "validatingStart": {
      const { path, uuid } = action.payload;

      const validating = {
        ...state.validating.val,
        [path]: { ...state.validating.val[path], [uuid]: true as const },
      };

      state.validating.set(validating);
      break;
    }

    case "validatingStop": {
      const { path, uuid } = action.payload;

      const validating = (() => {
        if (state.validating.val[path] == null) {
          return state.validating.val;
        }

        const validating = { ...state.validating.val };
        const uuids = { ...validating[path] };
        validating[path] = uuids;

        delete uuids[uuid];

        if (Object.keys(uuids).length === 0) {
          delete validating[path];
        }

        return validating;
      })();

      state.validating.set(validating);
      break;
    }

    case "setIsSubmitting": {
      const { isSubmitting } = action.payload;
      return state.isSubmitting.set(isSubmitting);
    }
  }
};
