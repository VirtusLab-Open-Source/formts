import { IsUnion } from "../../utils";

export type FieldDecoder<T> = {
  fieldType: FieldType;
  init: () => T;
  decode: (value: unknown) => DecoderResult<T>;

  // for array decoder
  inner: [T] extends [Array<infer E>] ? FieldDecoder<E> : undefined;

  // for choice decoder
  options: [T] extends [string]
    ? IsUnion<T> extends true
      ? T[]
      : undefined
    : undefined;
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
