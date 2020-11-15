import { entries, keys, values } from "../../../utils";
import { resolveTouched } from "../../helpers";
import { FormHandle } from "../../types/form-handle";
import { FormProvider } from "../../types/form-provider";
import { FormSchema } from "../../types/form-schema";
import { useInternalFormtsContext } from "../use-form-provider";

export const useFormHandle = <Values extends object, Err>(
  Schema: FormSchema<Values, Err>,
  Provider?: FormProvider
): FormHandle<Values, Err> => {
  const { state, methods } = useInternalFormtsContext({
    Schema,
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
