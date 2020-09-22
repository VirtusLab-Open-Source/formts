import { FieldDecoder } from "../types/field-decoder";

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
): FieldDecoder<Array<E>> => ({
  fieldType: "array",
  inner: innerDecoder,

  init: () => [],

  decode: value => {
    if (Array.isArray(value)) {
      const decodeResults = value.map(innerDecoder.decode);
      if (decodeResults.every(result => result.ok)) {
        return {
          ok: true,
          value: decodeResults.map(result => result.value as E),
        };
      }
    }
    return { ok: false, value };
  },
});
