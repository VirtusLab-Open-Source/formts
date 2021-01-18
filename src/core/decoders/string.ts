import { isValidDate } from "../../utils";
import { FieldDecoder, _FieldDecoderImpl } from "../types/field-decoder";
import { opaque } from "../types/type-mapper-util";

/**
 * Define field of type `string`.
 * Default initial value will be `""`.
 * Accepts strings, numbers, booleans and valid Date instances (which are serialized using toISOString method).
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

        case "number":
          return Number.isFinite(value)
            ? { ok: true, value: value.toString() }
            : { ok: false };

        case "boolean":
          return { ok: true, value: String(value) };

        case "object":
          return isValidDate(value)
            ? { ok: true, value: value.toISOString() }
            : { ok: false };

        default:
          return { ok: false };
      }
    },
  };

  return opaque(decoder);
};
