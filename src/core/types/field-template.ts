import { Nominal } from "../../utils";

import { _FieldDecoderImpl } from "./field-decoder";
import { FieldDescriptor } from "./field-descriptor";
import { impl } from "./type-mapper-util";

//@ts-ignore
export type _FieldTemplateImpl<T> = {
  __path: string;
};

/**
 * Pointer to a form field template.
 * Used to interact with Formts validation API via <arrayField>.every() method.
 */
// @ts-ignore
export interface FieldTemplate<T, Err = unknown>
  extends Nominal<"FieldTemplate", Err> { }

// prettier-ignore
export type GenericFieldTemplate<T, Err = unknown> =
  [T] extends [Array<unknown>]
  ? ArrayFieldTemplate<T, Err>
  : [T] extends [object]
  ? ObjectFieldTemplate<T, Err>
  : FieldTemplate<T, Err>;

// prettier-ignore
export type ArrayFieldTemplate<T extends Array<unknown>, Err> =
  & FieldTemplate<T, Err>
  & {
    readonly nth: (index?: number) => GenericFieldTemplate<T[number], Err>;
    readonly every: () => GenericFieldTemplate<T[number], Err>;
  };

// prettier-ignore
export type ObjectFieldTemplate<T extends object, Err> =
  & FieldTemplate<T, Err>
  & { readonly [K in keyof T]: GenericFieldTemplate<T[K], Err> };

export const isFieldTemplate = <T, Err>(x: FieldDescriptor<T, Err> | FieldTemplate<T, Err>):
  x is FieldTemplate<T, Err> =>
  //@ts-ignore
  impl(x).__lens == null