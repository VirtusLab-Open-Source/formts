import { assertNever, defineProperties, keys } from "../../../utils";
import { Lens } from "../../../utils/lenses";
import { FieldDecoder, _FieldDecoderImpl } from "../../types/field-decoder";
import { _FieldDescriptorImpl } from "../../types/field-descriptor";
import { _FieldTemplateImpl } from "../../types/field-template";
import { FormSchema } from "../../types/form-schema";

export type DecodersMap<O> = keyof O extends never
  ? never
  : { [K in keyof O]: FieldDecoder<O[K]> };

export const createFormSchema = <V extends object, Err>(
  decoders: DecodersMap<V>
): FormSchema<V, Err> => createObjectSchema(decoders, Lens.identity());

const createObjectSchema = <O extends object, Root, Err>(
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
  }, {} as FormSchema<O, Err>);
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
