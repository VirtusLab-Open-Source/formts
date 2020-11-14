import { FormProvider } from "../../types/form-provider";
import { FormSchema } from "../../types/form-schema";
import { useInternalFormtsContext } from "../use-form-provider";

export const useFormValues = <Values extends object, Err>(
  Schema: FormSchema<Values, Err>,
  Provider?: FormProvider
): Values => {
  const { state } = useInternalFormtsContext({ Schema, Provider });

  return state.values;
};
