import { FieldDecoder } from "./field-decoder";
import { Nominal } from "../utils";

// actual type, encapsulated away from public API
export type _FieldDescriptorImpl<T> = {
  path: string;
} & FieldDecoder<T>;

/**
 * Pointer to a form field.
 * Used to interact with Formts API via `useField` hook.
 */
export interface FieldDescriptor<T, Err = unknown>
  extends Nominal<"FieldDescriptor", { __ref?: [T, Err] }> {}

/**
 * Description of a form.
 * Used to interact with Formts API and point to specific form fields.
 */
export type FormSchema<Values extends object, Err> = Omit<
  ObjectFormDescriptorSchema<Values, Err>,
  "root"
>;

// prettier-ignore
type GenericFormDescriptorSchema<T, Err> = 
  [T] extends [Array<unknown>]
    ? ArrayFormDescriptorSchema<T, Err>
    : [T] extends [object]
      ? ObjectFormDescriptorSchema<T, Err>
      : FieldDescriptor<T, Err>;

type ArrayFormDescriptorSchema<T extends Array<unknown>, Err> = {
  readonly root: FieldDescriptor<T, Err>;
  readonly nth: (index: number) => GenericFormDescriptorSchema<T[number], Err>;
};

type ObjectFormDescriptorSchema<T extends object, Err> = {
  readonly root: FieldDescriptor<T, Err>;
} & {
  readonly [K in keyof T]: GenericFormDescriptorSchema<T[K], Err>;
};

/**
 * Creates type of the form values base on FormSchema.
 * Values of this type will be passed to submit handler.
 */
export type ExtractFormValues<
  S extends FormSchema<object, unknown>
> = S extends FormSchema<infer V, any> ? V : never;
