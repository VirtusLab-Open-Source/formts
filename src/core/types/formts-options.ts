import { DeepPartial } from "../../utils";

import { FormValidator } from "./form-validator";

export type FormtsOptions<Values extends object, Err> = {
  /**
   * Values used to override the defaults when filling the form
   * after the component is mounted or after form reset (optional).
   * The defaults depend on field type (defined in the Schema).
   */
  initialValues?: DeepPartial<Values>;

  /** Form validator created using `createForm.validator` function (optional). */
  validator?: FormValidator<Values, Err>;
};
