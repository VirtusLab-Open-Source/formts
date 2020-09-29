import { DeepPartial, get, set } from "../../utils";
import {
  FieldDescriptor,
  _FieldDescriptorImpl,
} from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";
import { impl } from "../types/type-mapper-util";

import { createInitialState } from "./create-initial-state";

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

/**
 * Hook used to create form controller - should be used in main form component.
 *
 * @returns tuple containing:
 * - `FieldHandleSchema` - tree of field handles used to interact with fields of the form
 * - `FormHandle` - used to interact with the form as a whole rather than with individual fields
 * - `FormtsProvider` - component enabling usage of `useField` hooks in nested components
 */
export const useFormts = <Values extends object, Err>(
  options: FormtsOptions<Values, Err>
) => {
  const formState = createInitialState(options.Schema, options.initialValues);
  return [formState, getter(formState), setter(formState)];
};

const getter = <Values extends object>(state: Values) => <T, Err>(
  desc: FieldDescriptor<T, Err>
): T => {
  return get(state, impl(desc).path) as any;
};

const setter = <Values extends object>(state: Values) => <T, Err>(
  desc: FieldDescriptor<T, Err>,
  value: T
): T => {
  return set(state, impl(desc).path, value) as any;
};
