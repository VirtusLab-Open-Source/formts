import { FieldDecoder, _FieldDecoderImpl } from "./field-decoder";
import { FieldDescriptor, _FieldDescriptorImpl } from "./field-descriptor";
import {
  ArrayFormDescriptorSchema,
  ObjectFormDescriptorSchema,
} from "./form-schema";

/**
 * expose implementation details of opaque type.
 * for internal use only
 */
export const impl: GetImplFn = (it: any) => it;
type GetImplFn = {
  <T extends any[], Err>(
    it: ArrayFormDescriptorSchema<T, Err>
  ): _FieldDescriptorImpl<T>;

  <T extends {}, Err>(
    it: ObjectFormDescriptorSchema<T, Err>
  ): _FieldDescriptorImpl<T>;

  <T, Err>(it: FieldDescriptor<T, Err>): _FieldDescriptorImpl<T>;

  <T>(it: FieldDecoder<T>): _FieldDecoderImpl<T>;
};

/**
 * hide implementation details of impl type.
 * for internal use only
 */
export const opaque: GetOpaque = (it: any) => it;
type GetOpaque = {
  <T, Err>(it: _FieldDescriptorImpl<T>): FieldDescriptor<T, Err>;
  <T>(it: _FieldDecoderImpl<T>): FieldDecoder<T>;
};
