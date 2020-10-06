import { FieldDecoder, _FieldDecoderImpl } from "../types/field-decoder";
import { opaqueDecoder } from "../types/type-mapper-util";

/**
 * Define field of type `number | ""` (empty string is needed to represent state of empty number inputs)
 * Does not accept infinite numbers: `Infinity`, `-Infinity`, `NaN`.
 * Default initial value will be `""`.
 *
 * @example
 * ```
 * const Schema = createForm.schema(fields => ({
 *   x: fields.number() // x: number | ""
 * }));
 * ```
 */
export const number = (): FieldDecoder<number | ""> => {
  const decoder: _FieldDecoderImpl<number | ""> = {
    fieldType: "number",

    init: () => "",

    decode: value => {
      switch (typeof value) {
        case "number":
          return Number.isFinite(value)
            ? { ok: true, value }
            : { ok: false, value };

        case "string": {
          return value === "" ? { ok: true, value } : { ok: false, value };
        }

        default:
          return { ok: false, value };
      }
    },
  };

  return opaqueDecoder(decoder);
};
