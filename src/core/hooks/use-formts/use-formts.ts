import { DeepPartial, get, set } from "../../../utils";
import {
  FieldDescriptor,
  _FieldDescriptorImpl,
} from "../../types/field-descriptor";
import { FormSchema } from "../../types/form-schema";
import { impl } from "../../types/type-mapper-util";

import { createInitialValues } from "./create-initial-values";

export type FormtsOptions<Values extends object, Err> = {
  /** Definition of form fields created using `createForm.schema` function.  */
  Schema: FormSchema<Values, Err>;

  /**
   * Values used to override the defaults when filling the form
   * after the component is mounted or after form reset (optional).
   * The defaults depend on field type (defined in the Schema).
   */
  initialValues?: DeepPartial<Values>;
};

export const useFormts = <Values extends object, Err>(
  options: FormtsOptions<Values, Err>
): [
  Values,
  <T, Err>(desc: FieldDescriptor<T, Err>) => T,
  <T, Err>(desc: FieldDescriptor<T, Err>, value: T) => Values
] => {
  const formValues = createInitialValues(options.Schema, options.initialValues);
  const get = getter(formValues);
  const set = setter(formValues);

  return [formValues, get, set];
};

const getter = <Values extends object>(state: Values) => <T, Err>(
  desc: FieldDescriptor<T, Err>
): T => {
  return get(state, impl(desc).path) as any;
};

const setter = <Values extends object>(state: Values) => <T, Err>(
  desc: FieldDescriptor<T, Err>,
  value: {} & T
): Values => {
  return set(state, impl(desc).path, value) as any;
};
