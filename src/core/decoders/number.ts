import { FieldDecoder } from "../types/field-decoder";

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
export const number = (): FieldDecoder<number | ""> => ({
  fieldType: "number",
  inner: undefined,
  options: undefined,

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
});
