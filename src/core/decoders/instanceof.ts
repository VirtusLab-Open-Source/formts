import { Constructor } from "../../utils";
import { FieldDecoder } from "../types/field-decoder";

/**s
 * Define object field holding instance of specified type or `null`.
 * Will perform `instanceof` check at runtime.
 * Default initial value will be `null`
 *
 * @example
 * ```
 * const Schema = createForm.schema(fields => ({
 *   x: fields.instanceOf(Date) // x: Date | null
 * }));
 * ```
 */
export const instanceOf = <T>(
  constructor: Constructor<T>
): FieldDecoder<T | null> => {
  switch (constructor as Constructor<any>) {
    case Object:
    case Array:
    case String:
    case Number:
    case Boolean:
      throw new Error(
        `instanceOf field: illegal constructor used: ${constructor.name}`
      );
  }

  return {
    fieldType: "class",
    inner: undefined as any,
    options: undefined as any,

    init: () => null,

    decode: value =>
      value instanceof constructor ? { ok: true, value } : { ok: false, value },
  };
};
