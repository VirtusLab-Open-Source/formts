import { DeepPartial } from "../../utils";
import { _FieldDescriptorImpl } from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";

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
  const initialState = createInitialState(
    options.Schema,
    options.initialValues
  );

  return initialState;
};
