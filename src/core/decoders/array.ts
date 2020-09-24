import { FieldDecoder, _FieldDecoderImpl } from "../types/field-decoder";
import { impl, opaque } from "../types/type-mapper-util";

/**
 * Define array field with elements of type defined by provided `innerDecoder`.
 * Will check if value is array and if each element matches expected type at runtime.
 * Default initial value will be `[]`
 *
 * @example
 * ```
 * const Schema = createForm.schema(fields => ({
 *   x: fields.array(fields.string()) // x: string[]
 * }));
 * ```
 */
export const array = <E>(
  innerDecoder: FieldDecoder<E>
): FieldDecoder<Array<E>> => {
  const decoder: _FieldDecoderImpl<Array<E>> = {
    fieldType: "array",
    inner: impl(innerDecoder),

    init: () => [],

    decode: value => {
      if (Array.isArray(value)) {
        const decodeResults = value.map(impl(innerDecoder).decode);
        if (decodeResults.every(result => result.ok)) {
          return {
            ok: true,
            value: decodeResults.map(result => result.value as E),
          };
        }
      }
      return { ok: false, value };
    },
  };

  return opaque(decoder);
};
