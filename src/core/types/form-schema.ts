import { FieldDescriptor, _FieldDescriptorImpl } from "./field-descriptor";
import { impl } from "./type-mapper-util";

// TODO: remove GenericFormDescriptorSchema and move the conditional into FieldDescriptor and _FieldDescriptorImpl
// TODO: might be enough to get rid of the ugly approx types!

/**
 * Description of a form.
 * Used to interact with Formts API and point to specific form fields.
 */
export type FormSchema<Values extends object, Err> = {
  readonly [K in keyof Values]: GenericFormDescriptorSchema<Values[K], Err>;
};

// prettier-ignore
export type GenericFormDescriptorSchema<T, Err> = 
  [T] extends [Array<unknown>]
    ? ArrayFormDescriptorSchema<T, Err>
    : [T] extends [object]
      ? ObjectFormDescriptorSchema<T, Err>
      : FieldDescriptor<T, Err>;

// prettier-ignore
export type ArrayFormDescriptorSchema<T extends Array<unknown>, Err> =
  & FieldDescriptor<T, Err> 
  & { readonly nth: (index: number) => GenericFormDescriptorSchema<T[number], Err>; };

// prettier-ignore
export type ObjectFormDescriptorSchema<T extends object, Err> = 
  & FieldDescriptor<T, Err> 
  & { readonly [K in keyof T]: GenericFormDescriptorSchema<T[K], Err> };

export const isArrayDescriptor = <T extends any[], Err>(
  it: FieldDescriptor<T, Err>
): it is ArrayFormDescriptorSchema<T, Err> =>
  impl(it).__decoder.fieldType === "array";

export const isObjectDescriptor = <T extends {}, Err>(
  it: FieldDescriptor<T, Err>
): it is ObjectFormDescriptorSchema<T, Err> =>
  impl(it).__decoder.fieldType === "object";
