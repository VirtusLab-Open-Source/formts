import {
  FieldDecoder,
  _FieldDecoderImpl,
  _ObjectFieldDecoderImpl,
} from "../types/field-decoder";
import { impl } from "../types/type-mapper-util";

// prettier-ignore
type ObjectFieldDecoderWithGuards<
  O extends object
> = O[keyof O] extends undefined
  ? void
  : Extract<keyof O, "root"> extends never
    ? FieldDecoder<O>
    : void;

/**
 * Define nested object field with shape defined by `innerDecoders` param.
 * Will check if value is an object and if it contains all specified properties of the right types at runtime.
 *
 * @example
 * ```
 * const Schema = createForm.schema(fields => ({
 *   x: fields.object({
 *     foo: fields.string(),
 *     bar: fields.number()
 *   }) // x: { foo: string; bar: number | "" }
 * }));
 * ```
 */
export const object = <O extends object>(
  innerDecoders: {
    [K in keyof O]: FieldDecoder<O[K]>;
  }
): ObjectFieldDecoderWithGuards<O> => {
  const decoder: _ObjectFieldDecoderImpl<O> = {
    fieldType: "object",

    inner: innerDecoders as any, // meh

    init: () =>
      Object.keys(innerDecoders).reduce((initialValues, key) => {
        const prop = key as keyof O;
        initialValues[prop] = impl(innerDecoders[prop]).init();
        return initialValues;
      }, {} as O),

    decode: value => {
      if (typeof value !== "object" || value == null) {
        return { ok: false, value };
      }

      const decodedObject = {} as O;
      for (let key of Object.keys(innerDecoders)) {
        const result = impl(innerDecoders[key as keyof O]).decode(
          (value as O)[key as keyof O]
        );
        if (!result.ok) {
          return { ok: false, value };
        } else {
          decodedObject[key as keyof O] = result.value;
        }
      }

      return { ok: true, value: decodedObject };
    },
  };

  return decoder as any; // meh
};
