import { Nominal } from "../../utils";

import { _FieldDecoderImpl } from "./field-decoder";
import { impl } from "./type-mapper-util";

// actual type, encapsulated away from public API
export type _FieldDescriptorImpl<T> = {
  __path: string;
  __decoder: _FieldDecoderImpl<T>;
};

/**
 * Pointer to a form field.
 * Used to interact with Formts API via `useField` hook.
 */
// @ts-ignore
export interface FieldDescriptor<T, Err = unknown>
  extends Nominal<"FieldDescriptor", {}> {}

// prettier-ignore
export type GenericFieldDescriptor<T, Err = unknown> = 
[T] extends [Array<unknown>]
  ? ArrayFieldDescriptor<T, Err>
  : [T] extends [object]
    ? ObjectFieldDescriptor<T, Err>
    : FieldDescriptor<T, Err>;

// prettier-ignore
export type ArrayFieldDescriptor<T extends Array<unknown>, Err> =
  & FieldDescriptor<T, Err> 
  & { readonly nth: (index: number) => GenericFieldDescriptor<T[number], Err>; };

// prettier-ignore
export type ObjectFieldDescriptor<T extends object, Err> = 
  & FieldDescriptor<T, Err> 
  & { readonly [K in keyof T]: GenericFieldDescriptor<T[K], Err> };

export const isArrayDescriptor = <T extends any[], Err>(
  it: FieldDescriptor<T, Err>
): it is ArrayFieldDescriptor<T, Err> =>
  impl(it).__decoder.fieldType === "array";

export const isObjectDescriptor = <T extends {}, Err>(
  it: FieldDescriptor<T, Err>
): it is ObjectFieldDescriptor<T, Err> =>
  impl(it).__decoder.fieldType === "object";
