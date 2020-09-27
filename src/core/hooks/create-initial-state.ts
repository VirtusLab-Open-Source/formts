import { DeepPartial, entries } from "../../utils";
import { _FieldDescriptorImpl } from "../types/field-descriptor";
import { FormSchema, GenericFormDescriptorSchema } from "../types/form-schema";
import { impl } from "../types/type-mapper-util";

export const createInitialState = <Values extends object>(
  schema: FormSchema<Values, any>,
  initial?: DeepPartial<Values>
): Values => {
  const initialStateFromDecoders = entries(schema).reduce(
    (shape, [key, val]) => {
      const descriptor = val as GenericFormDescriptorSchema<any, any>;

      //FIXME
      const fieldInitialValue =
        "root" in descriptor
          ? impl(descriptor.root).init()
          : impl(descriptor).init();

      shape[key] = fieldInitialValue;
      return shape;
    },
    {} as Values
  );

  return { ...initialStateFromDecoders, ...initial };
};
