import { FieldDecoder } from "./field-decoder";
import { FormSchema } from "./descriptors";

const Fields = {
  bool: FieldDecoder.bool,
  number: FieldDecoder.number,
  string: FieldDecoder.string,
  choice: FieldDecoder.choice,
  array: FieldDecoder.array,
  object: FieldDecoder.object,
  instanceOf: FieldDecoder.instanceOf,
};

type BuilderFn<V> = (
  fields: typeof Fields
) => {
  [K in keyof V]: FieldDecoder<V[K]>;
};

type ErrorsMarker<Err> = (errors: <Err>() => Err) => Err;

/**
 * Define shape of the form values and type of validation errors.
 * This is used not only for compile-time type-safety but also for runtime validation of form values.
 * The schema can be defined top-level, so that it can be exported to nested Form components for use together with `useField` hook.
 *
 * @returns
 * FormSchema - used to interact with Formts API and point to specific form fields
 *
 * @example
 * ```
 * const Schema = createForm.schema(
 *   fields => ({
 *     name: fields.string(),
 *     age: fields.number(),
 *   }),
 *   errors => errors<string>()
 * );
 * ```
 */
export const createFormSchema = <Values extends object, Err = never>(
  fields: BuilderFn<Values>,
  errors?: ErrorsMarker<Err>
): FormSchema<Values, Err> => {
  throw new Error("not implemented!");
};
