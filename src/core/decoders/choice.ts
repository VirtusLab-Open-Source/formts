import {
  FieldDecoder,
  _ChoiceFieldDecoderImpl,
  _FieldDecoderImpl,
} from "../types/field-decoder";
import { opaque } from "../types/type-mapper-util";

/**
 * Define field of given string literal union type.
 * Will check values against provided whitelist.
 * Default initial value will be first option received.
 *
 * **requires at least one option to be provided**
 *
 * @example
 * ```
 * const Schema = createForm.schema(fields => ({
 *   x: fields.choice("A", "B", "C") // x: "A" | "B" | "C"
 * }));
 * ```
 */
export const choice = <Opts extends string>(
  firstOption: Opts,
  ...otherOptions: Opts[]
): FieldDecoder<Opts> => {
  const options = [firstOption, ...otherOptions];

  const optionsDictionary = options.reduce<Record<string, Opts | undefined>>(
    (dict, opt) => {
      dict[opt] = opt;
      return dict;
    },
    {}
  );

  const decoder: _ChoiceFieldDecoderImpl<Opts> = {
    options,

    fieldType: "choice",

    init: () => firstOption,

    decode: value => {
      switch (typeof value) {
        case "string": {
          const option = optionsDictionary[value];
          return option != null ? { ok: true, value: option } : { ok: false };
        }
        case "number": {
          if (Number.isFinite(value)) {
            const option = optionsDictionary[value.toString()];
            return option != null ? { ok: true, value: option } : { ok: false };
          } else {
            return { ok: false };
          }
        }
        default:
          return { ok: false };
      }
    },
  };

  return opaque(decoder as _FieldDecoderImpl<Opts>);
};
