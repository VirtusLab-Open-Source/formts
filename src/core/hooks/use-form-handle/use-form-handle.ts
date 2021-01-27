import { useMemo } from "react";

import { keys, values } from "../../../utils";
import { Atom } from "../../../utils/atoms";
import { useSubscription } from "../../../utils/use-subscription";
import { useFormtsContext } from "../../context";
import { resolveTouched } from "../../helpers";
import { FormController } from "../../types/form-controller";
import { FormHandle } from "../../types/form-handle";
import { FormSchema } from "../../types/form-schema";

/**
 * Hook used to gain access to form-wide methods and properties computed from all fields.
 * Causes the component to subscribe to changes to form state that affect the computed properties.
 *
 * @param Schema - obtained by calling `createFormSchema` function, used to infer types.
 * @param controller - obtained by using `useFormController` hook, used to connect to form state.
 * Injected automatically via React Context when used inside `FormProvider` component.
 *
 * @returns `FormHandle` used to interact with form.
 *
 * @example
 * ```ts
 * const Schema = createFormSchema(...);
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
  const { state, methods } = useFormtsContext<Values, Err>(controller);

  const stateAtom = useMemo(
    () =>
      Atom.fuse(
        (touched, validating, errors, isSubmitting) => ({
          touched,
          validating,
          errors,
          isSubmitting,
        }),
        state.touched,
        state.validating,
        state.errors,
        state.isSubmitting
      ),
    [state]
  );

  useSubscription(stateAtom);

  return {
    isSubmitting: state.isSubmitting.val,

    get isTouched() {
      return resolveTouched(state.touched.val);
    },

    get isValid() {
      return values(state.errors.val).filter(err => err != null).length === 0;
    },

    get isValidating() {
      return keys(state.validating.val).length > 0;
    },

    validate: methods.validateForm,

    reset: methods.resetForm,

    submit: (onSuccess, onFailure) => {
      return methods.submitForm().then(resp => {
        if (resp.ok) {
          return onSuccess(resp.values);
        } else {
          return onFailure?.(resp.errors);
        }
      });
    },

    setFieldValue: (field, value) => {
      return methods.setFieldValue(field, value);
    },

    setFieldError: (field, error) => {
      methods.setFieldErrors({ field, error });
    },
  };
};
