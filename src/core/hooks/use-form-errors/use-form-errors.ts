import { useMemo } from "react";

import { Atom } from "../../../utils/atoms";
import { useSubscription } from "../../../utils/use-subscription";
import { useFormtsContext } from "../../context";
import { FieldError } from "../../types/field-error";
import { FormController } from "../../types/form-controller";
import { FormSchema } from "../../types/form-schema";

/**
 * Hook used to gain access to errors of all invalid form fields.
 * Causes the component to subscribe to changes of all field errors.
 *
 * @param Schema - created using `FormSchemaBuilder`, needed for type inference.
 * @param controller - obtained by using `useFormController` hook, used to connect to form state.
 * Injected automatically via React Context when used inside `FormProvider` component.
 *
 * @returns array of all field errors represented as `FieldError` objects. Each object contains field ID and it's error.
 *
 * @example
 * ```ts
 * const Schema = new FormSchemaBuilder()...;
 *
 * const MyForm: React.FC = () => {
 *   const controller = useFormController({ Schema })
 *   const errors = useFormErrors(Schema, controller)
 *
 *   ...
 * }
 * ```
 */
export const useFormErrors = <Values extends object, Err>(
  _Schema: FormSchema<Values, Err>,
  controller?: FormController
): Array<FieldError<Err>> => {
  const { state } = useFormtsContext<Values, Err>(controller);
  const stateAtom = useMemo(
    () =>
      Atom.fuse(
        errorsDict =>
          Object.entries(errorsDict)
            .filter(([, error]) => error != null)
            .map(([fieldId, error]) => ({ fieldId, error: error! })),

        state.errors
      ),
    [state]
  );

  useSubscription(stateAtom);

  return stateAtom.val;
};
