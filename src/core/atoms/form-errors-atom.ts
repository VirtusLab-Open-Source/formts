import { Atom } from "../../utils/atoms";
import { FormtsAtomState } from "../types/formts-state";

export type FormErrorsAtom<Err> = Atom.Readonly<
  Array<{
    fieldId: string;
    error: Err;
  }>
>;

export const createFormErrorsAtom = <Values extends object, Err>(
  state: FormtsAtomState<Values, Err>
): FormErrorsAtom<Err> =>
  Atom.fuse(
    errorsDict =>
      Object.entries(errorsDict)
        .filter(([, error]) => error != null)
        .map(([fieldId, error]) => ({ fieldId, error: error! })),

    state.errors
  );
