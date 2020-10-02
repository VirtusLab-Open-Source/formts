import { FieldDescriptor, _FieldDescriptorImpl } from "./field-descriptor";

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

type ArrayFormDescriptorSchema<T extends Array<unknown>, Err> = {
  readonly root: FieldDescriptor<T, Err>;
  readonly nth: (index: number) => GenericFormDescriptorSchema<T[number], Err>;
};

type ObjectFormDescriptorSchema<T extends object, Err> = {
  readonly root: FieldDescriptor<T, Err>;
} & { readonly [K in keyof T]: GenericFormDescriptorSchema<T[K], Err> };
