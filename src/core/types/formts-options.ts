import { FormSchema } from "./form-schema";
import { FormValidator } from "./form-validator";
import { InitialValues } from "./formts-state";

export type FormtsOptions<Values extends object, Err> = {
  /** Definition of form fields created using `FormSchemaBuilder`.  */
  Schema: FormSchema<Values, Err>;

  /**
   * Values used to override the defaults when filling the form
   * after the component is mounted or after form reset (optional).
   * The defaults depend on field type (defined in the Schema).
   * Snapshot of the initialValues will be taken when mounting the component
   * and further changes to it will be ignored. If you want to change
   * initialValues use FormHandle.reset method.
   */
  initialValues?: InitialValues<Values>;

  /** Form validator created using `FormValidatorBuilder` (optional). */
  validator?: FormValidator<Values, Err>;
};
