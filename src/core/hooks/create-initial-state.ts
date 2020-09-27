import { DeepPartial } from "../../utils";
import { _FieldDescriptorImpl } from "../types/field-descriptor";
import { FormSchema, GenericFormDescriptorSchema } from "../types/form-schema";
import { impl } from "../types/type-mapper-util";

export const createInitialState = <Values extends object>(
  schema: FormSchema<Values, any>,
  initial?: DeepPartial<Values>
): Values => {
  const initialStateFromDecoders = Object.keys(schema).reduce<Values>(
    (shape, k) => {
      const key = k as keyof Values;
      const descriptor = schema[key] as GenericFormDescriptorSchema<any, any>;

      //FIXME
      const fieldInitialValue =
        "root" in descriptor
          ? impl(descriptor.root).init()
          : impl(descriptor).init();

      shape[key] = fieldInitialValue as Values[typeof key];
      return shape;
    },
    {} as Values
  );

  return { ...initialStateFromDecoders, ...initial };
};
