import { assertNever, defineProperties, keys } from "../../utils";
import { Lens } from "../../utils/lenses";
import * as Decoders from "../decoders";
import { FieldDecoder, _FieldDecoderImpl } from "../types/field-decoder";
import { _FieldDescriptorImpl } from "../types/field-descriptor";
import { FormSchema } from "../types/form-schema";
import { impl } from "../types/type-mapper-util";

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
): FormSchema<Values, Err> =>
  createObjectSchema(fields(Decoders), Lens.identity()) as any;

const createObjectSchema = <O extends object, Root>(
  decodersMap: DecodersMap<O>,
  lens: Lens<Root, O>,
  path?: string,
  parent?: _FieldDescriptorImpl<unknown>
) => {
  return keys(decodersMap).reduce((schema, key) => {
    const decoder = decodersMap[key];
    (schema as any)[key] = createFieldDescriptor(
      impl(decoder) as _FieldDecoderImpl<any>,
      Lens.compose(lens, Lens.prop(key as any)),
      path ? `${path}.${key}` : `${key}`,
      parent
    );
    return schema;
  }, {} as FormSchema<O, unknown>);
};

const createFieldDescriptor = (
  decoder: _FieldDecoderImpl<any>,
  lens: Lens<any, any>,
  path: string,
  parent?: _FieldDescriptorImpl<unknown>
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
      __lens: {
        value: lens,
        enumerable: false,
        writable: false,
        configurable: false,
      },
      __parent: {
        value: parent,
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
    case "date":
    case "choice":
      return rootDescriptor;

    case "array": {
      const nthHandler = (i: number) =>
        createFieldDescriptor(
          decoder.inner as _FieldDecoderImpl<any>,
          Lens.compose(lens, Lens.index(i)),
          `${path}[${i}]`,
          rootDescriptor
        );

      const nth = defineProperties(nthHandler, {
        __rootPath: {
          value: path,
          enumerable: false,
          writable: false,
          configurable: false,
        },
      });

      return Object.assign(rootDescriptor, { nth });
    }

    case "object": {
      const props = createObjectSchema(
        decoder.inner as DecodersMap<unknown>,
        lens,
        path,
        rootDescriptor
      );
      return Object.assign(rootDescriptor, props);
    }

    default:
      return assertNever(decoder.fieldType);
  }
};
