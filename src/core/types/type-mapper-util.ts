import { FieldDecoder, _FieldDecoderImpl } from "./field-decoder";
import {
  FieldDescriptor,
  ArrayFieldDescriptor,
  ObjectFieldDescriptor,
  _FieldDescriptorImpl,
  _NTHHandler,
} from "./field-descriptor";
import { FieldTemplate, _FieldTemplateImpl } from "./field-template";
import { FormController, _FormControllerImpl } from "./form-controller";
import { FormValidator, _FormValidatorImpl } from "./form-validator";

/**
 * expose implementation details of opaque type.
 * for internal use only
 */
export const impl: GetImplFn = (it: any) => it;
type GetImplFn = {
  <T extends any[], Err>(
    it: ArrayFieldDescriptor<T, Err>
  ): _FieldDescriptorImpl<T>;

  <T extends Record<string, any>, Err>(
    it: ObjectFieldDescriptor<T, Err>
  ): _FieldDescriptorImpl<T>;

  <T>(it: FieldDecoder<T>): _FieldDecoderImpl<T>;

  <V extends object, Err>(it: FormValidator<V, Err>): _FormValidatorImpl<
    V,
    Err
  >;

  <T, Err>(it: FieldDescriptor<T, Err>): _FieldDescriptorImpl<T>;
  <T, Err>(
    it: FieldTemplate<T, Err> | FieldDescriptor<T, Err>
  ): _FieldTemplateImpl<T>;

  <V extends object, Err>(it: FormController): _FormControllerImpl<V, Err>;

  <T extends any>(it: ArrayFieldDescriptor<T[], unknown>["nth"]): _NTHHandler<
    T
  >;
};

/**
 * hide implementation details of impl type.
 * for internal use only
 */
export const opaque: GetOpaque = (it: any) => it;
type GetOpaque = {
  <T, Err>(it: _FieldDescriptorImpl<T>): FieldDescriptor<T, Err>;
  <T>(it: _FieldDecoderImpl<T>): FieldDecoder<T>;
  <V extends object, Err>(it: _FormControllerImpl<V, Err>): FormController;
  <V extends object, Err>(it: _FormValidatorImpl<V, Err>): FormValidator<
    V,
    Err
  >;
};
