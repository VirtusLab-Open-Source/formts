import { ArrayElement } from "../../utils";

import { _FieldDescriptorImpl } from "./field-descriptor";
import { FormSchema } from "./form-schema";

// loose typing for helping with internal impl, as working with generic target types is impossible

export type _FormSchemaApprox_<Values extends object> = {
  [key in keyof Values]: _DescriptorApprox_<Values[key]>;
};

export type _DescriptorApprox_<Value> =
  | _FieldDescriptorImpl<Value>
  | _ArrayDescriptorApprox_<Value>
  | _ObjectDescriptorApprox_<Value>;

type _ArrayDescriptorApprox_<Value> = _FieldDescriptorImpl<Value> & {
  readonly nth: (index: number) => _DescriptorApprox_<ArrayElement<Value>>;
};

type _ObjectDescriptorApprox_<Value> = _FieldDescriptorImpl<Value> &
  { [x in keyof Value]: _DescriptorApprox_<Value[x]> };

export const schemaImpl = <Values extends object>(
  schema: FormSchema<Values, undefined>
): _FormSchemaApprox_<Values> => schema as any;
