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
 *
 * @example
 * ```
 * const Schema = createForm.schema(fields => ({
 *   x: fields.date() // x: Date | null
 * }));
 * ```
 */
export const date = (): FieldDecoder<Date | null> => {
  const decoder: _FieldDecoderBaseImpl<Date | null> = {
    fieldType: "date",

    init: () => null,

    decode: value =>
      value === null || isDate(value) ? { ok: true, value } : { ok: false },
  };

  return opaque(decoder as _FieldDecoderImpl<Date | null>);
};

const isDate = (val: unknown): val is Date =>
  val instanceof Date && !Number.isNaN(val.valueOf());
