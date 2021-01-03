import { Constructor } from "../../utils";
import {
  FieldDecoder,
  _InstanceFieldDecoderImpl,
  _FieldDecoderImpl,
} from "../types/field-decoder";
import { opaque } from "../types/type-mapper-util";

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
  instanceConstructor: Constructor<T>
): FieldDecoder<T | null> => {
  switch (instanceConstructor as Constructor<any>) {
    case Object:
    case Array:
    case String:
    case Number:
    case Boolean:
      throw new Error(
        `instanceOf field: illegal constructor used: ${instanceConstructor.name}`
      );
  }

  const decoder: _InstanceFieldDecoderImpl<T | null> = {
    fieldType: "class",
    instanceConstructor,

    init: () => null,

    decode: value =>
      value === null || value instanceof instanceConstructor
        ? { ok: true, value }
        : { ok: false },
  };

  return opaque(decoder as _FieldDecoderImpl<T | null>);
};
