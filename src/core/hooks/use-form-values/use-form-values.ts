import { useFormtsContext } from "../../context";
import { FormControl } from "../../types/form-control";
import { FormSchema } from "../../types/form-schema";

export const useFormValues = <Values extends object, Err>(
  _Schema: FormSchema<Values, Err>,
  control?: FormControl
): Values => {
  const { state } = useFormtsContext<Values, Err>(control);

  return state.values;
};
