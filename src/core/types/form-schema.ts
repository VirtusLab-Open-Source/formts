import { GenericFieldDescriptor } from "./field-descriptor";

/**
 * Description of a form.
 * Used to interact with Formts API and point to specific form fields.
 */
export type FormSchema<Values extends object, Err> = {
  readonly [K in keyof Values]: GenericFieldDescriptor<Values[K], Err>;
};
