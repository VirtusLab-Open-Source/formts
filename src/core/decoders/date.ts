import { isValidDate } from "../../utils";
import {
  FieldDecoder,
  _FieldDecoderBaseImpl,
  _FieldDecoderImpl,
} from "../types/field-decoder";
import { opaque } from "../types/type-mapper-util";

/**
 * Define field holding an instance of JS Date or `null`
 * Will check that value is a valid date at runtime.
 * Default initial value will be `null`
 * Accepts valid Date instances and strings or numbers that create valid Date when passed into Date constructor.
 *
 * @example
 * ```
 * const Schema = new FormSchemaBuilder()
 *  .fields({
 *    x: FormFields.date() // x: Date | null
 *  })
 *  .build()
 * ```
 */
export const date = (): FieldDecoder<Date | null> => {
  const decoder: _FieldDecoderBaseImpl<Date | null> = {
    fieldType: "date",

    init: () => null,

    decode: value => {
      switch (typeof value) {
        case "object":
          return value === null || isValidDate(value)
            ? { ok: true, value }
            : { ok: false };

        case "string":
        case "number": {
          const valueAsDate = new Date(value);
          return isValidDate(valueAsDate)
            ? { ok: true, value: valueAsDate }
            : { ok: false };
        }

        default:
          return { ok: false };
      }
    },
  };

  return opaque(decoder as _FieldDecoderImpl<Date | null>);
};
