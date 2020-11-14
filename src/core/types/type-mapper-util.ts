import { FieldDecoder, _FieldDecoderImpl } from "./field-decoder";
import {
  FieldDescriptor,
  ArrayFieldDescriptor,
  ObjectFieldDescriptor,
  _FieldDescriptorImpl,
} from "./field-descriptor";
import { FormProvider, _FormProviderImpl } from "./form-provider";

/**
 * expose implementation details of opaque type.
 * for internal use only
 */
export const impl: GetImplFn = (it: any) => it;
type GetImplFn = {
  <T extends any[], Err>(
    it: ArrayFieldDescriptor<T, Err>
  ): _FieldDescriptorImpl<T>;

  <T extends {}, Err>(it: ObjectFieldDescriptor<T, Err>): _FieldDescriptorImpl<
    T
  >;

  <T, Err>(it: FieldDescriptor<T, Err>): _FieldDescriptorImpl<T>;

  <T>(it: FieldDecoder<T>): _FieldDecoderImpl<T>;

  <V extends object, Err>(it: FormProvider): _FormProviderImpl<V, Err>;
};

/**
 * hide implementation details of impl type.
 * for internal use only
 */
export const opaque: GetOpaque = (it: any) => it;
type GetOpaque = {
  <T, Err>(it: _FieldDescriptorImpl<T>): FieldDescriptor<T, Err>;
  <T>(it: _FieldDecoderImpl<T>): FieldDecoder<T>;
  <V extends object, Err>(it: _FormProviderImpl<V, Err>): FormProvider;
};
