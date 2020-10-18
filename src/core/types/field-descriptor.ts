import { Nominal } from "../../utils";

import { _FieldDecoderImpl } from "./field-decoder";

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
