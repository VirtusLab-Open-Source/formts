import { ChoiceFieldDecoder } from "../types/field-decoder";

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
  <Opts extends string>(...options: Opts[]): ChoiceFieldDecoder<Opts>;
};

export const choice: ChoiceDecoderFactory = <Opts extends string>(
  ...options: Opts[]
): ChoiceFieldDecoder<Opts> => {
  if (options.length === 0) {
    throw new Error("choice field: no options provided");
  }

  return {
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
};
