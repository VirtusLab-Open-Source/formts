import { assertNever, defineProperties, keys } from "../../utils";
import {
  bool,
  string,
  number,
  choice,
  instanceOf,
  array,
  object,
} from "../decoders";
import { FieldDecoder, _FieldDecoderImpl } from "../types/field-decoder";
import { _FieldDescriptorImpl } from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";
import { impl } from "../types/type-mapper-util";

const Decoders = {
  bool,
  string,
  number,
  choice,
  instanceOf,
  array,
  object,
};

type BuilderFn<V> = (fields: typeof Decoders) => DecodersMap<V>;

type DecodersMap<O> = { [K in keyof O]: FieldDecoder<O[K]> };

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
 * const Schema = createFormSchema(
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
): FormSchema<Values, Err> => createObjectSchema(fields(Decoders)) as any;

const createObjectSchema = <O extends object>(
  decodersMap: DecodersMap<O>,
  path?: string
) => {
  return keys(decodersMap).reduce((schema, key) => {
    const decoder = decodersMap[key];
    (schema as any)[key] = createFieldDescriptor(
      impl(decoder) as _FieldDecoderImpl<any>,
      path ? `${path}.${key}` : `${key}`
    );
    return schema;
  }, {} as FormSchema<O, unknown>);
};

const createFieldDescriptor = (
  decoder: _FieldDecoderImpl<any>,
  path: string
): _FieldDescriptorImpl<any> => {
  // these properties are hidden implementation details and thus should not be enumerable
  const rootDescriptor = defineProperties(
    {},
    {
      __decoder: {
        value: decoder,
        enumerable: false,
        writable: false,
        configurable: false,
      },
      __path: {
        value: path,
        enumerable: false,
        writable: false,
        configurable: false,
      },
    }
  );

  switch (decoder.fieldType) {
    case "bool":
    case "number":
    case "string":
    case "class":
    case "choice":
      return rootDescriptor;

    case "array": {
      const nth = (i: number) =>
        createFieldDescriptor(
          decoder.inner as _FieldDecoderImpl<any>,
          `${path}[${i}]`
        );

      return Object.assign(rootDescriptor, { nth });
    }

    case "object": {
      const props = createObjectSchema(
        decoder.inner as DecodersMap<object>,
        path
      );
      return Object.assign(rootDescriptor, props);
    }

    default:
      return assertNever(decoder.fieldType);
  }
};
