import { Constructor } from "../../utils";
import {
  FieldDecoder,
  _FieldDecoderBaseImpl,
  _FieldDecoderImpl,
} from "../types/field-decoder";
import { opaqueDecoder } from "../types/type-mapper-util";

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

  const decoder: _FieldDecoderBaseImpl<T | null> = {
    fieldType: "class",

    init: () => null,

    decode: value =>
      value instanceof constructor ? { ok: true, value } : { ok: false, value },
  };

  return opaqueDecoder(decoder as _FieldDecoderImpl<T | null>);
};
