import { ArrayElement, IsStringUnion, Nominal } from "../../utils";

// prettier-ignore
export type _FieldDecoderImpl<T> = [T] extends [Array<any>]
  ? _ArrayFieldDecoderImpl<T>
  : IsStringUnion<T> extends true
    ? _ChoiceFieldDecoderImpl<T>
    : _FieldDecoderBaseImpl<T>;

export type _FieldDecoderBaseImpl<T> = {
  fieldType: FieldType;
  init: () => T;
  decode: (value: unknown) => DecoderResult<T>;
};

export type _ArrayFieldDecoderImpl<T> = _FieldDecoderBaseImpl<T> & {
  inner: _FieldDecoderImpl<ArrayElement<T>>;
};

export type _ChoiceFieldDecoderImpl<T> = _FieldDecoderBaseImpl<T> & {
  options: T[];
};

/**
 * Object containing run-time type information about a field.
 * Should be used together with `createForm.schema` function.
 */
export interface FieldDecoder<T>
  extends Nominal<"FieldDecoder", { __ref?: [T] }> {}

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
