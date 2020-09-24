import {
  FieldDecoder,
  _ChoiceFieldDecoderImpl,
  _FieldDecoderImpl,
} from "../types/field-decoder";
import { opaque } from "../types/type-mapper-util";

type ChoiceDecoderFactory = {
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
  (): void;

  /**
   * Define field of given string literal union type.
   * Will check values against provided whitelist.
   * Default initial value will be first option received.
   *
   * @example
   * ```
   * const Schema = createForm.schema(fields => ({
   *   x: fields.choice("A", "B", "C") // x: "A" | "B" | "C"
   * }));
   * ```
   */
  <Opts extends string>(...options: Opts[]): FieldDecoder<Opts>;
};

export const choice: ChoiceDecoderFactory = <Opts extends string>(
  ...options: Opts[]
): FieldDecoder<Opts> => {
  if (options.length === 0) {
    throw new Error("choice field: no options provided");
  }

  const decoder: _ChoiceFieldDecoderImpl<Opts> = {
    options,

    fieldType: "choice",

    init: () => options[0],

    decode: value => {
      switch (typeof value) {
        case "string":
          return options.includes(value as Opts)
            ? { ok: true, value: value as Opts }
            : { ok: false, value };
        default:
          return { ok: false, value };
      }
    },
  };

  return opaque(decoder as _FieldDecoderImpl<Opts>);
};
