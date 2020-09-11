import { FormValidator } from "./form-validator";
import { FormTransformer } from "./form-transformer";
import { DeepPartial } from "../utils";

import { FieldHandleSchema } from "./field-handle-schema";
import { FormHandle } from "./form-handle";
import { FormSchema } from "./descriptors";

/**
 * Component enabling usage of `useField` hooks in nested components
 */
type FormtsProvider = React.FC;

export type FormtsOptions<Values extends object, Err> = {
  /** Definition of form fields created using `createForm.schema` function.  */
  Schema: FormSchema<Values, Err>;

  /**
   * Values used to override the defaults when filling the form
   * after the component is mounted or after form reset (optional).
   * The defaults depend on field type (defined in the Schema).
   */
  initialValues?: DeepPartial<Values>;

  /** Form validator created using `createForm.validator` function (optional). */
  validator?: FormValidator<Values, Err>;

  /** Form transformer created using `createForm.transformer` function (optional). */
  transformer?: FormTransformer<Values, Err>;
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
): [
  FieldHandleSchema<Values, Err>,
  FormHandle<Values, Err>,
  FormtsProvider
] => {
  throw new Error("not implemented!");
};
