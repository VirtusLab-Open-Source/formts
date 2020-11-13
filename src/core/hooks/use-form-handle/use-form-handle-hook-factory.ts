import { entries, keys, values } from "../../../utils";
import { resolveTouched } from "../../helpers";
import { FormHandle } from "../../types/form-handle";
import { FormProvider } from "../../types/form-provider";
import { HookFactoryContext } from "../../types/formts-context";
import { useInternalFormtsContext } from "../use-form-provider";

export type UseFormHandleHook<Values extends object, Err> = {
  /**
   * useFormHandle // TODO
   */
  (Provider?: FormProvider<Values, Err>): FormHandle<Values, Err>;
};

export const useFormHandleHookFactory = <Values extends object, Err>({
  Schema,
  Context,
}: HookFactoryContext<Values, Err>): UseFormHandleHook<
  Values,
  Err
> => Provider => {
  const { state, methods } = useInternalFormtsContext({
    Schema,
    Context,
    Provider,
  });

  return {
    // TODO: remove
    values: state.values,

    isSubmitting: state.isSubmitting,

    // TODO: remove
    get errors() {
      return entries(state.errors)
        .filter(([, err]) => err != null)
        .map(([path, error]) => ({ path, error: error! }));
    },

    get isTouched() {
      return resolveTouched(state.touched);
    },

    get isValid() {
      return values(state.errors).filter(err => err != null).length === 0;
    },

    get isValidating() {
      return keys(state.validating).length > 0;
    },

    validate: methods.validateForm,

    reset: methods.resetForm,

    getSubmitHandler: (onSuccess, onFailure) => event => {
      event?.preventDefault();

      return methods.submitForm().then(resp => {
        if (resp.ok) {
          return onSuccess(resp.values);
        } else {
          return onFailure?.(resp.errors);
        }
      });
    },
  };
};
