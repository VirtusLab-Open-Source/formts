import { deepEqual, keys, values } from "../../utils";
import { Atom } from "../../utils/atoms";
import { resolveTouched } from "../helpers";
import { FormSchema } from "../types/form-schema";
import { FormtsAtomState } from "../types/formts-state";
import { impl } from "../types/type-mapper-util";

export const createFormHandleAtom = <Values extends object, Err>(
  state: FormtsAtomState<Values, Err>,
  Schema: FormSchema<Values, Err>
) =>
  Atom.fuse(
    (
      isTouched,
      isChanged,
      isValid,
      isValidating,
      isSubmitting,
      successfulSubmitCount,
      failedSubmitCount
    ) => ({
      isTouched,
      isChanged,
      isValid,
      isValidating,
      isSubmitting,
      successfulSubmitCount,
      failedSubmitCount,
    }),

    Atom.fuse(
      (sc, fc, touched) => sc > 0 || fc > 0 || resolveTouched(touched),
      state.successfulSubmitCount,
      state.failedSubmitCount,
      state.touched
    ),
    Atom.fuse(
      (...fieldsChanged) => fieldsChanged.some(Boolean),
      ...values(Schema).map(field => {
        const fieldLens = impl(field).__lens;
        return Atom.fuse(
          (initialValue, fieldValue) => !deepEqual(fieldValue, initialValue),
          Atom.entangle(state.initialValues, fieldLens),
          Atom.entangle(state.values, fieldLens)
        );
      })
    ),
    Atom.fuse(x => values(x).every(err => err == null), state.errors),
    Atom.fuse(x => keys(x).length > 0, state.validating),
    state.isSubmitting,
    state.successfulSubmitCount,
    state.failedSubmitCount
  );
