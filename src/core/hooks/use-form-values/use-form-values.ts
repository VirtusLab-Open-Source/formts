import { useFormtsContext } from "../../context";
import { FormController } from "../../types/form-controller";
import { FormSchema } from "../../types/form-schema";

export const useFormValues = <Values extends object, Err>(
  _Schema: FormSchema<Values, Err>,
  controller?: FormController
): Values => {
  const { state } = useFormtsContext<Values, Err>(controller);

  return state.values;
};
