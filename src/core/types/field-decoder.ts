export type FieldDecoder<T> = {
  fieldType: FieldType;
  decode: (value: unknown) => DecoderResult<T>;
};

export type FieldType =
  | "number"
  | "string"
  | "choice"
  | "bool"
  | "array"
  | "class";
// | "object"

export type DecoderResult<T> =
  | { ok: true; value: T }
  | { ok: false; value: unknown };
