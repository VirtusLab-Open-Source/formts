import { Nominal } from "../../utils";

import { GenericFieldDescriptor } from "./field-descriptor";

/**
 * Description of a form.
 * Used to interact with Formts API and point to specific form fields.
 */
export type FormSchema<Values extends object, Err> = Nominal<"FormSchema"> &
  {
    readonly [K in keyof Values]: GenericFieldDescriptor<Values[K], Err>;
  };

export type ExtractFormValues<Schema> = Schema extends FormSchema<infer V, any>
  ? V
  : never;
