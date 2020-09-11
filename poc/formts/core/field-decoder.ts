import { Constructor } from "../utils";

// TODO: hide this type from public api
export type FieldDecoder<T> = {
  fieldKind: FieldDecoder.Kind;
  decode: (value: unknown) => FieldDecoder.Result<T>;
};

export namespace FieldDecoder {
  export type Kind =
    | "number"
    | "string"
    | "choice"
    | "bool"
    | "array"
    | "object"
    | "class";

  export type Result<T> =
    | { ok: true; value: T }
    | { ok: false; value: unknown };

  export type Extract<T extends FieldDecoder<unknown>> = T extends FieldDecoder<
    infer T
  >
    ? T
    : never;

  /**
   * Define field of type `boolean`.
   * Will convert strings "true" and "false" to booleans at runtime.
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
    fieldKind: "bool",
    decode: value => {
      switch (typeof value) {
        case "boolean":
          return { ok: true, value };
        case "string":
          switch (value.toLowerCase()) {
            case "true":
              return { ok: true, value: true };
            case "false":
              return { ok: true, value: false };
          }
        default:
          return { ok: false, value };
      }
    },
  });

  /**
   * Define field of type `number | ""` ("" is needed for empty number inputs to work)
   * Will convert string values to numbers at runtime if possible.
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
    fieldKind: "number",
    decode: value => {
      switch (typeof value) {
        case "number":
        case "string": {
          if (value === "") {
            return { ok: true, value };
          }
          const num = Number(value);
          return Number.isNaN(num)
            ? { ok: false, value }
            : { ok: true, value: num };
        }
        default:
          return { ok: false, value };
      }
    },
  });

  /**
   * Define field of type `string`.
   * Will convert numbers and booleans to strings at runtime.
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
    fieldKind: "string",
    decode: value => {
      switch (typeof value) {
        case "string":
          return { ok: true, value };
        case "number":
        case "boolean":
          return { ok: true, value: value.toString() };
        default:
          return { ok: false, value };
      }
    },
  });

  /**
   * Define field of given string literal union type.
   * Will check against provided whitelist and convert numbers and booleans to strings at runtime.
   * Default initial value will be first option received.
   *
   * @example
   * ```
   * const Schema = createForm.schema(fields => ({
   *   x: fields.choice("A", "B", "C") // x: "A" | "B" | "C"
   * }));
   * ```
   */
  export const choice = <Opts extends string>(
    ...options: Opts[]
  ): FieldDecoder<Opts> => ({
    fieldKind: "choice",
    decode: value => {
      switch (typeof value) {
        case "string":
        case "number":
        case "boolean":
          const stringified = value.toString() as Opts;
          return options.includes(stringified)
            ? { ok: true, value: stringified }
            : { ok: false, value };
        default:
          return { ok: false, value };
      }
    },
  });

  /**
   * Define array field with elements of type defined by provided `innerDecoder`.
   * Will check if value is array and if each element matches expected type at runtime.
   * Default initial value will be `[]`
   *
   * @example
   * ```
   * const Schema = createForm.schema(fields => ({
   *   x: fields.array(fields.string()) // x: string[]
   * }));
   * ```
   */
  export const array = <E>(
    innerDecoder: FieldDecoder<E>
  ): FieldDecoder<Array<E>> => ({
    fieldKind: "array",
    decode: value => {
      if (Array.isArray(value)) {
        const decodeResults = value.map(innerDecoder.decode);
        if (decodeResults.every(result => result.ok)) {
          return {
            ok: true,
            value: decodeResults.map(result => result.value as E),
          };
        }
      }
      return { ok: false, value };
    },
  });

  /**
   * Define nested object field with shape defined by `innerDecoders` param.
   * Will check if value is an object and if it contains all specified properties of the right type at runtime.
   *
   * @example
   * ```
   * const Schema = createForm.schema(fields => ({
   *   x: fields.object({
   *     foo: fields.string(),
   *     bar: fields.number()
   *   }) // x: { foo: string; bar: number | "" }
   * }));
   * ```
   */
  export const object = <O extends object>(
    innerDecoders: ObjectDecoders<O>
  ): FieldDecoder<O> => ({
    fieldKind: "object",
    decode: value => {
      if (typeof value !== "object" || value == null) {
        return { ok: false, value };
      }

      const decodedObject = {} as O;
      for (let key of Object.keys(innerDecoders)) {
        const result = innerDecoders[key as keyof O].decode(
          (value as any)[key]
        );
        if (!result.ok) {
          return { ok: false, value };
        } else {
          decodedObject[key as keyof O] = result.value;
        }
      }

      return { ok: true, value: decodedObject };
    },
  });
  type ObjectDecoders<O extends object> = {
    [K in keyof O]: FieldDecoder<O[K]>;
  };

  /**
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
    switch (constructor) {
      case Object as Constructor<any>:
      case String as Constructor<any>:
      case Number as Constructor<any>:
      case Boolean as Constructor<any>:
      case Error as Constructor<any>:
        throw new Error(
          `instanceOf field: illegal constructor used: ${constructor.name}`
        );
    }
    return {
      fieldKind: "class",
      decode: value =>
        value instanceof constructor
          ? { ok: true, value }
          : { ok: false, value },
    };
  };
}
