import { DeepPartial } from "../../utils";

import { FormSchema } from "./form-schema";
import { FormValidator } from "./form-validator";

export type FormtsOptions<Values extends object, Err> = {
  /** Definition of form fields created using `createFormSchema` function.  */
  Schema: FormSchema<Values, Err>;

  /**
   * Values used to override the defaults when filling the form
   * after the component is mounted or after form reset (optional).
   * The defaults depend on field type (defined in the Schema).
   */
  initialValues?: DeepPartial<Values>;

  /** Form validator created using `createFormValidator` function (optional). */
  validator?: FormValidator<Values, Err>;
};
