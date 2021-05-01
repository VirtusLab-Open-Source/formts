import { assertNever, defineProperties, keys } from "../../utils";
import { Lens } from "../../utils/lenses";
import { FieldDecoder, _FieldDecoderImpl } from "../types/field-decoder";
import { _FieldDescriptorImpl } from "../types/field-descriptor";
import { _FieldTemplateImpl } from "../types/field-template";
import { FormSchema } from "../types/form-schema";

type DecodersMap<O> = keyof O extends never
  ? never
  : { [K in keyof O]: FieldDecoder<O[K]> };

/**
 * Builds schema which defines shape of the form values and type of validation errors.
 * The schema is used not only for compile-time type-safety but also for runtime validation of form values.
 * The schema can be defined top-level, so that it can be exported to nested Form components for usage together with `useField` hook.
 *
 * @returns
 * FormSchema - used to interact with Formts API and point to specific form fields
 *
 * @example
 * ```
 * import { FormSchemaBuilder, FormFields } from "@virtuslab/formts"
 *
 * const Schema = new FormSchemaBuilder()
 *   .fields({
 *     name: FormFields.string(),
 *     age: FormFields.number(),
 *   })
 *   .errors<string>()
 *   .build()
 * ```
 */
export class FormSchemaBuilder {
  private decoders: DecodersMap<any> = {} as any;

  /**
   * Builds schema which defines shape of the form values and type of validation errors.
   * The schema is used not only for compile-time type-safety but also for runtime validation of form values.
   * The schema can be defined top-level, so that it can be exported to nested Form components for usage together with `useField` hook.
   *
   * @returns
   * FormSchema - used to interact with Formts API and point to specific form fields
   *
   * @example
   * ```
   * import { FormSchemaBuilder, FormFields } from "@virtuslab/formts"
   *
   * const Schema = new FormSchemaBuilder()
   *   .fields({
   *     name: FormFields.string(),
   *     age: FormFields.number(),
   *   })
   *   .errors<string>()
   *   .build()
   * ```
   */
  constructor() {}

  /**
   * Define form fields as dictionary of decoders. Use `FormFields` import.
   *
   * @example
   * ```
   * new FormSchemaBuilder()
   *   .fields({
   *     name: FormFields.string(),
   *     age: FormFields.number(),
   *   })
   * ```
   */
  fields = <V extends object>(fields: DecodersMap<V>) => {
    this.decoders = fields;

    return (this as any) as SchemaBuilder$Fields<V>;
  };

  /**
   * Define form errors to be used by `FormValidatorBuilder`.
   *
   * @example
   * ```
   * new FormSchemaBuilder()
   *   .errors<MyErrorCodesEnum>()
   * ```
   */
  errors = <Err>() => {
    return (this as any) as SchemaBuilder$Errors<Err>;
  };

  // @ts-ignore
  private build = () => createObjectSchema(this.decoders, Lens.identity());
}

interface SchemaBuilder$Errors<Err> {
  /**
   * Define form fields as dictionary of decoders. Use `FormFields` import.
   *
   * @example
   * ```
   * new FormSchemaBuilder()
   *   .fields({
   *     name: FormFields.string(),
   *     age: FormFields.number(),
   *   })
   * ```
   */
  fields: <V extends object>(
    fields: DecodersMap<V>
  ) => SchemaBuilder$Complete<V, Err>;
}

interface SchemaBuilder$Fields<V extends object> {
  /**
   * Define form errors to be used by `FormValidatorBuilder`.
   *
   * @example
   * ```
   * new FormSchemaBuilder()
   *   .errors<MyErrorCodesEnum>()
   * ```
   */
  errors: <Err>() => SchemaBuilder$Complete<V, Err>;

  /** finalize construction of `FormSchema` */
  build: () => FormSchema<V, never>;
}

interface SchemaBuilder$Complete<V extends object, Err> {
  /** finalize construction of `FormSchema` */
  build: () => FormSchema<V, Err>;
}

const createObjectSchema = <O extends object, Root>(
  decodersMap: DecodersMap<O>,
  lens: Lens<Root, O>,
  path?: string,
  parent?: _FieldDescriptorImpl<unknown>
) => {
  return keys(decodersMap).reduce((schema, key) => {
    const decoder = decodersMap[key];
    (schema as any)[key] = createFieldDescriptor(
      decoder as any,
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
      __decoder: hiddenJsProperty(decoder),
      __path: hiddenJsProperty(path),
      __lens: hiddenJsProperty(lens),
      __parent: hiddenJsProperty(parent),
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
        __rootPath: hiddenJsProperty(path),
      });

      const every = () =>
        createFieldTemplate(
          decoder.inner as _FieldDecoderImpl<any>,
          `${path}[*]`
        );

      return Object.assign(rootDescriptor, { nth, every });
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

const createFieldTemplate = (
  decoder: _FieldDecoderImpl<any>,
  path: string
): _FieldTemplateImpl<any> => {
  // these properties are hidden implementation details and thus should not be enumerable
  const rootDescriptor = defineProperties(
    {},
    { __path: hiddenJsProperty(path) }
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
        createFieldTemplate(
          decoder.inner as _FieldDecoderImpl<any>,
          `${path}[${i}]`
        );

      const nth = defineProperties(nthHandler, {
        __rootPath: hiddenJsProperty(path),
      });

      const every = () =>
        createFieldTemplate(
          decoder.inner as _FieldDecoderImpl<any>,
          `${path}[*]`
        );

      return Object.assign(rootDescriptor, { nth, every });
    }

    case "object": {
      const props = createObjectTemplateSchema(
        decoder.inner as DecodersMap<unknown>,
        path
      );
      return Object.assign(rootDescriptor, props);
    }

    default:
      return assertNever(decoder.fieldType);
  }
};

const createObjectTemplateSchema = <O extends object>(
  decodersMap: DecodersMap<O>,
  path: string
) => {
  return keys(decodersMap).reduce((schema, key) => {
    const decoder = decodersMap[key];
    (schema as any)[key] = createFieldTemplate(
      decoder as any,
      `${path}.${key}`
    );
    return schema;
  }, {} as { [x in keyof O]: _FieldTemplateImpl<O[x]> });
};

const hiddenJsProperty = <T>(value: T) =>
  ({
    value,
    enumerable: false,
    writable: false,
    configurable: false,
  } as const);
