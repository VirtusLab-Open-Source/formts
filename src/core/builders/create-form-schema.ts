import { bool, string, number, choice, array, instanceOf } from "../decoders";
import { FieldDecoder } from "../types/field-decoder";
import { FormSchema } from "../types/form-schema";

const Fields = {
  bool,
  string,
  number,
  choice,
  array,
  instanceOf,
};

// FIXME: decoder.choice()
type BuilderFn<V> = (
  fields: typeof Fields
) => { [K in keyof V]: FieldDecoder<V[K]> };

type ErrorsMarker<Err> = (errors: <Err>() => Err) => Err;

/**
 * Define shape of the form values and type of validation errors.
 * This is used not only for compile-time type-safety but also for runtime validation of form values.
 * The schema can be defined top-level, so that it can be exported to nested Form components for usage together with `useField` hook.
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
  _fields: BuilderFn<Values>,
  _errors?: ErrorsMarker<Err>
): FormSchema<Values, Err> => {
  throw new Error("not implemented!");
};
