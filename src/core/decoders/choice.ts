import { FieldDecoder } from "../types/field-decoder";

type ChoiceDecoderFactory = {
  (): never;
  <Opts extends string>(...options: Opts[]): FieldDecoder<Opts>;
};

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
export const choice: ChoiceDecoderFactory = <Opts extends string>(
  ...options: readonly Opts[]
) => {
  const decoder: FieldDecoder<string> = {
    fieldType: "choice",
    inner: undefined,
    options: options as any,

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

  return decoder as never;
};
