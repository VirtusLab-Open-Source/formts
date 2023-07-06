import { Nominal } from "../../utils";

import { GenericFieldDescriptor } from "./field-descriptor";

/**
 * Description of a form.
 * Used to interact with Formts API and point to specific form fields.
 * Created using FormSchemaBuilder class.
 */
export type FormSchema<Values extends object, Err> = Nominal<"FormSchema"> &
  {
    readonly [K in keyof Values]: GenericFieldDescriptor<Values[K], Err>;
  };

/**
 * Helper type for inferring type of form values as received by FormHandle.submit function
 *
 * @example
 * ```ts
 * type Values = ExtractFormValues<typeof Schema>
 * ```
 */
export type ExtractFormValues<Schema> = Schema extends FormSchema<infer V, any>
  ? V
  : never;
