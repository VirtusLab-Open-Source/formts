import { useMemo } from "react";

import { Task } from "../../../utils/task";
import { useSubscription } from "../../../utils/use-subscription";
import { useFormtsContext } from "../../context";
import { FormController } from "../../types/form-controller";
import { FormHandle } from "../../types/form-handle";
import { FormSchema } from "../../types/form-schema";
import { impl } from "../../types/type-mapper-util";

/**
 * Hook used to gain access to form-wide methods and properties computed from all fields.
 * Causes the component to subscribe to changes to form state that affect the computed properties.
 *
 * @param Schema - created using `FormSchemaBuilder`, needed for type inference.
 * @param controller - obtained by using `useFormController` hook, used to connect to form state.
 * Injected automatically via React Context when used inside `FormProvider` component.
 *
 * @returns `FormHandle` used to interact with form.
 *
 * @example
 * ```ts
 * const Schema = new FormSchemaBuilder()...;
 *
 * const MyForm: React.FC = () => {
 *   const controller = useFormController({ Schema })
 *   const formHandle = useFormHandle(Schema, controller)
 *
 *   ...
 * }
 * ```
 */
export const useFormHandle = <Values extends object, Err>(
  _Schema: FormSchema<Values, Err>,
  controller?: FormController
): FormHandle<Values, Err> => {
  const { atoms, methods } = useFormtsContext<Values, Err>(controller);
  useSubscription(atoms.formHandle);

  return useMemo(
    () => ({
      get isSubmitting() {
        return atoms.formHandle.val.isSubmitting;
      },

      get isTouched() {
        return atoms.formHandle.val.isTouched;
      },

      get isChanged() {
        return atoms.formHandle.val.isChanged;
      },

      get isValid() {
        return atoms.formHandle.val.isValid;
      },

      get isValidating() {
        return atoms.formHandle.val.isValidating;
      },

      get submitCount() {
        const {
          successfulSubmitCount,
          failedSubmitCount,
        } = atoms.formHandle.val;

        return {
          valid: successfulSubmitCount,
          invalid: failedSubmitCount,
          total: successfulSubmitCount + failedSubmitCount,
        };
      },

      reset: newInitialValues =>
        methods.resetForm(newInitialValues).runPromise(),

      validate: () => methods.validateForm().runPromise(),

      submit: (onSuccess, onFailure) =>
        methods
          .submitForm(
            values => Task.from(() => onSuccess(values)).map(() => {}),
            errors => Task.from(() => onFailure?.(errors))
          )
          .runPromise(),

      setFieldValue: (field, value) =>
        methods.setFieldValue(field, value).runPromise(),

      setFieldError: (field, error) =>
        methods
          .setFieldErrors({ path: impl(field).__path, error })
          .runPromise(),
    }),
    [atoms.formHandle.val]
  );
};
