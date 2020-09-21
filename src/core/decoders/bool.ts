import { FieldDecoder } from "../types/field-decoder";

/**
 * Define field of type `boolean`.
 * Default initial value will be `false`.
 *
 * @example
 * ```
 * const Schema = createForm.schema(fields => ({
 *   x: fields.bool() // x: boolean
 * }));
 * ```
 */
export const bool = (): FieldDecoder<boolean> => ({
  fieldType: "bool",
  inner: undefined,
  options: undefined,

  init: () => false,

  decode: value => {
    switch (typeof value) {
      case "boolean":
        return { ok: true, value };
      default:
        return { ok: false, value };
    }
  },
});
