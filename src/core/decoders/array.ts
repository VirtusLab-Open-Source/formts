import { FieldDecoder, _FieldDecoderImpl } from "../types/field-decoder";
import { impl, opaque } from "../types/type-mapper-util";

/**
 * Define array field with elements of type defined by provided `innerDecoder`.
 * Default initial value will be `[]`
 * Accepts empty arrays and arrays containing elements which are valid in respect to rules imposed by `innerDecoder`.
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
      if (value && Array.isArray(value)) {
        const decodeResults = value.map(impl(innerDecoder).decode);
        if (decodeResults.every(result => result.ok)) {
          return {
            ok: true,
            value: decodeResults.map(result => result.value as E),
          };
        }
      }
      return { ok: false };
    },
  };

  return opaque(decoder);
};
