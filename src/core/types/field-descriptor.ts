import { Nominal, range, values } from "../../utils";
import { flatMap } from "../../utils/array";
import { Lens } from "../../utils/lenses";

import { _FieldDecoderImpl } from "./field-decoder";
import { GenericFieldTemplate } from "./field-template";
import { impl, opaque } from "./type-mapper-util";

// actual type, encapsulated away from public API
export type _FieldDescriptorImpl<T> = {
  __path: string;
  __decoder: _FieldDecoderImpl<T>;
  __lens: Lens<any, T>; // TODO maybe add root typing Lens<Root, T>
  __parent?: _FieldDescriptorImpl<unknown>;
};

export type _NTHHandler<T> = {
  __rootPath: string;
  (n: number): _FieldDecoderImpl<T>;
};

/**
 * Pointer to a form field.
 * Used to interact with Formts API via `useField` hook.
 */
// @ts-ignore
export interface FieldDescriptor<T, Err = unknown>
  extends Nominal<"FieldDescriptor", Err> {}

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
  & {
    readonly nth: (index: number) => GenericFieldDescriptor<T[number], Err>;
    readonly every: () => GenericFieldTemplate<T[number], Err>;
  };

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

export const isPrimitiveDescriptor = (
  field: FieldDescriptor<unknown>
): boolean => {
  return !isArrayDescriptor(field) && !isObjectDescriptor(field);
};

export const getArrayDescriptorChildren = <T extends Array<unknown>, Err>(
  descriptor: ArrayFieldDescriptor<T, Err>,
  numberOfChildren: number
): Array<ReturnType<typeof descriptor["nth"]>> => {
  return range(0, numberOfChildren - 1).map(descriptor.nth);
};

export const getObjectDescriptorChildren = <T extends {}, Err>(
  descriptor: ObjectFieldDescriptor<T, Err>
): Array<typeof descriptor[keyof typeof descriptor]> => {
  return values(descriptor);
};

export const getChildrenDescriptors = <Err>(
  descriptor: FieldDescriptor<unknown, Err>,
  getValue: (field: FieldDescriptor<unknown, Err>) => unknown
): Array<FieldDescriptor<unknown, Err>> => {
  const root = [descriptor];

  if (isObjectDescriptor(descriptor)) {
    const children = getObjectDescriptorChildren(descriptor);
    return root.concat(
      flatMap(children, x => getChildrenDescriptors(x, getValue))
    );
  } else if (isArrayDescriptor(descriptor)) {
    const numberOfChildren = (getValue(descriptor) as any[])?.length;
    if (numberOfChildren === 0) {
      return root;
    }
    const children = getArrayDescriptorChildren(descriptor, numberOfChildren);
    return root.concat(
      flatMap(children, x =>
        getChildrenDescriptors(x as FieldDescriptor<unknown, Err>, getValue)
      )
    );
  } else {
    return root;
  }
};

export const getParentsChain = <Err>(
  descriptor: FieldDescriptor<any, Err>
): FieldDescriptor<any, Err>[] => {
  const parent = impl(descriptor).__parent;
  if (!parent) {
    return [];
  } else {
    const opaqueParent = opaque(parent) as FieldDescriptor<any, Err>;
    return [opaqueParent, ...getParentsChain(opaqueParent)];
  }
};
