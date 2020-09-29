import { deepMerge, DeepPartial, entries } from "../../utils";
import { _FieldDescriptorImpl } from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";
import {
  isArrayDesc,
  isObjectDesc,
  schemaImpl,
  _DescriptorApprox_,
  _FormSchemaApprox_,
} from "../types/form-schema-approx";

export const createInitialState = <Values extends object>(
  _schema: FormSchema<Values, any>,
  initial?: DeepPartial<Values>
): Values => {
  const schema = schemaImpl(_schema);

  const initialStateFromDecoders = entries(schema).reduce(
    (shape, [key, value]) => {
      const descriptor = value as _DescriptorApprox_<Values[typeof key]>;

      const fieldInitialValue =
        isArrayDesc(descriptor) || isObjectDesc(descriptor)
          ? descriptor.root.init()
          : descriptor.init();

      shape[key] = fieldInitialValue;
      return shape;
    },
    {} as Values
  );

  return initial
    ? deepMerge(initialStateFromDecoders, initial)
    : initialStateFromDecoders;
};
