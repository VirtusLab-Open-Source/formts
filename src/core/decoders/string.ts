import { FieldDecoder } from "../types/field-decoder";

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
export const string = (): FieldDecoder<string> => ({
  fieldType: "string",
  inner: undefined,
  options: undefined,

  init: () => "",

  decode: value => {
    switch (typeof value) {
      case "string":
        return { ok: true, value };
      default:
        return { ok: false, value };
    }
  },
});
