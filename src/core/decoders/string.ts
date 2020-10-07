import { FieldDecoder, _FieldDecoderImpl } from "../types/field-decoder";
import { opaque } from "../types/type-mapper-util";

/**
 * Define field of type `string`.
 * Default initial value will be `""`.
 *
 * @example
 * ```
 * const Schema = createForm.schema(fields => ({
 *   x: fields.string() // x: string
 * }));
 * ```
 */
export const string = (): FieldDecoder<string> => {
  const decoder: _FieldDecoderImpl<string> = {
    fieldType: "string",

    init: () => "",

    decode: value => {
      switch (typeof value) {
        case "string":
          return { ok: true, value };
        default:
          return { ok: false, value };
      }
    },
  };

  return opaque(decoder);
};
