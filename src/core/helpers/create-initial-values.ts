import { deepMerge, DeepPartial, entries } from "../../utils";
import { _FieldDescriptorImpl } from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";
import { impl } from "../types/type-mapper-util";

export const createInitialValues = <Values extends object>(
  schema: FormSchema<Values, any>,
  initial?: DeepPartial<Values>
): Values => {
  const initialStateFromDecoders = entries(schema).reduce(
    (shape, [key, descriptor]) => {
      shape[key] = impl(descriptor).__decoder.init();
      return shape;
    },
    {} as Values
  );

  return initial
    ? deepMerge(initialStateFromDecoders, initial)
    : initialStateFromDecoders;
};
