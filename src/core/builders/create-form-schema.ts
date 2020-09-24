import { assertNever } from "../../utils";
import { bool, string, number, choice, array, instanceOf } from "../decoders";
import { FieldDecoder } from "../types/field-decoder";
import { _FieldDescriptorImpl } from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";

const Decoders = {
  bool,
  string,
  number,
  choice,
  array,
  instanceOf,
};

type BuilderFn<V> = (
  fields: typeof Decoders
) => { [K in keyof V]: FieldDecoder<V[K]> };

type ErrorsMarker<Err> = (errors: <Err>() => Err) => Err;

// loose typing for helping with internal impl, as working with generic target types is impossible
type _FormSchemaApprox_ = Record<string, _DescriptorApprox_>;

type _DescriptorApprox_ =
  | _FieldDescriptorImpl<any>
  | {
      readonly root: _FieldDescriptorImpl<any>;
      readonly nth: (index: number) => _DescriptorApprox_;
    };

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
  fields: BuilderFn<Values>,
  _errors?: ErrorsMarker<Err>
): FormSchema<Values, Err> => {
  const decodersMap = fields(Decoders);

  return Object.keys(decodersMap).reduce<_FormSchemaApprox_>((schema, key) => {
    const decoder = decodersMap[key as keyof Values];
    schema[key] = createFieldDescriptor(decoder as FieldDecoder<any>, key);
    return schema;
  }, {}) as any;
};

const createFieldDescriptor = (
  decoder: FieldDecoder<any>,
  path: string
): _DescriptorApprox_ => {
  switch (decoder.fieldType) {
    case "bool":
    case "number":
    case "string":
    case "class":
    case "choice":
      return { ...decoder, path };

    case "array": {
      const root = { ...decoder, path };
      const nth = (i: number) =>
        createFieldDescriptor(
          decoder.inner as FieldDecoder<any>,
          `${path}.${i}`
        );

      return { root, nth };
    }

    default:
      return assertNever(decoder.fieldType);
  }
};
