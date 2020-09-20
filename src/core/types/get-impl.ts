import { FieldDescriptor, _FieldDescriptorImpl } from "./field-descriptor";

type GetImplFn = {
  <T, Err>(it: FieldDescriptor<T, Err>): _FieldDescriptorImpl<T>;
};

// expose implementation details of opaque type
// for internal use only
export const impl: GetImplFn = (it: any) => it;
