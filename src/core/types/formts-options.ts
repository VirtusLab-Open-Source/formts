import { FormSchema } from "./form-schema";
import { FormValidator } from "./form-validator";

export type FormtsOptions<Values extends object, Err> = {
  /** Definition of form fields created using `FormSchemaBuilder`.  */
  Schema: FormSchema<Values, Err>;

  /**
   * Values used to override the defaults when filling the form
   * after the component is mounted or after form reset (optional).
   * The defaults depend on field type (defined in the Schema).
   */
  initialValues?: InitialValues<Values>;

  /** Form validator created using `FormValidatorBuilder` (optional). */
  validator?: FormValidator<Values, Err>;
};

/** DeepPartial, except for objects inside arrays */
// prettier-ignore
export type InitialValues<T> = T extends Function
  ? T
  : T extends Array<any>
    ? T
    : T extends object
      ? { [P in keyof T]?: InitialValues<T[P]> }
      : T | undefined;
