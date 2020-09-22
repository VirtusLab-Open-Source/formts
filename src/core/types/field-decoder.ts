import { ArrayElement, IsStringUnion } from "../../utils";

// prettier-ignore
export type FieldDecoder<T> = [T] extends [Array<any>]
  ? ArrayFieldDecoder<T>
  : IsStringUnion<T> extends true
    ? ChoiceFieldDecoder<T>
    : FieldDecoderBase<T>;

export type FieldDecoderBase<T> = {
  fieldType: FieldType;
  init: () => T;
  decode: (value: unknown) => DecoderResult<T>;
};

export type ArrayFieldDecoder<T> = FieldDecoderBase<T> & {
  inner: FieldDecoder<ArrayElement<T>>;
};

export type ChoiceFieldDecoder<T> = FieldDecoderBase<T> & {
  options: T[];
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
