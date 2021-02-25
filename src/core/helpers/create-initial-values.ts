import { deepMerge, DeepPartial, entries } from "../../utils";
import { _FieldDescriptorImpl } from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";
import { InitialValues } from "../types/formts-options";
import { impl } from "../types/type-mapper-util";

export const createInitialValues = <Values extends object>(
  schema: FormSchema<Values, any>,
  initial?: InitialValues<Values>
): Values => {
  const initialStateFromDecoders = entries(schema).reduce(
    (shape, [key, descriptor]) => {
      shape[key] = impl(descriptor).__decoder.init() as Values[keyof Values];
      return shape;
    },
    {} as Values
  );

  return initial
    ? deepMerge(
        initialStateFromDecoders,
        (initial as unknown) as DeepPartial<Values>
      )
    : initialStateFromDecoders;
};
