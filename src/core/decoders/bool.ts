import { FieldDecoder, _FieldDecoderImpl } from "../types/field-decoder";
import { opaque } from "../types/type-mapper-util";

/**
 * Define field of type `boolean`.
 * Default initial value will be `false`.
 * Accepts boolean values and string "true" | "false".
 *
 * @example
 * ```
 * const Schema = new FormSchemaBuilder()
 *  .fields({
 *    x: FormFields.bool() // x: boolean
 *  })
 *  .build()
 * ```
 */
export const bool = (): FieldDecoder<boolean> => {
  const decoder: _FieldDecoderImpl<boolean> = {
    fieldType: "bool",

    init: () => false,

    decode: value => {
      switch (typeof value) {
        case "boolean":
          return { ok: true, value };

        case "string": {
          switch (value.toLowerCase().trim()) {
            case "true":
              return { ok: true, value: true };
            case "false":
              return { ok: true, value: false };
            default:
              return { ok: false };
          }
        }

        default:
          return { ok: false };
      }
    },
  };

  return opaque(decoder);
};
