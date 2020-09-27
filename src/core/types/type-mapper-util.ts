import { FieldDecoder, _FieldDecoderImpl } from "./field-decoder";
import { FieldDescriptor, _FieldDescriptorImpl } from "./field-descriptor";

/**
 * expose implementation details of opaque type.
 * for internal use only
 */
export const impl: GetImplFn = (it: any) => it;
type GetImplFn = {
  <T>(it: FieldDecoder<T>): _FieldDecoderImpl<T>;
  <T, Err>(it: FieldDescriptor<T, Err>): _FieldDescriptorImpl<T>;
};

/**
 * hide implementation details of impl type.
 * for internal use only
 */
export const opaque: GetOpaque = (it: any) => it;
type GetOpaque = {
  <T>(it: _FieldDecoderImpl<T>): FieldDecoder<T>;
  <T, Err>(it: _FieldDescriptorImpl<T>): FieldDescriptor<T, Err>;
};