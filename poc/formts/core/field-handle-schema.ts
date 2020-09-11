import { FieldHandle } from "./field-handle";

/**
 * Tree of field handles used to interact with all fields of the form
 */
export type FieldHandleSchema<Values extends object, Err> = {
  readonly [K in keyof Values]: FieldHandle<Values[K], Err>;
};
