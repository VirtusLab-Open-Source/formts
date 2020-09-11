import { Falsy } from "../utils";

import { FieldDescriptor, FormSchema } from "./descriptors";

export type TransformResult<T> = { ok: true; value: T } | { ok: false };

/**
 * Function responsible for mapping and filtering values of single form field.
 * The transformation only supports mapping inside the same type `T -> T`
 *
 * @param value - value to be transformed of type `T`
 *
 * @returns TransformResult
 */
export type Transformer<T> = (value: T) => TransformResult<T>;

export type TransformationTrigger = "change" | "blur" | "submit";

export type FormTransformer<Values extends object, Err> = {
  transform: <T>(
    field: FieldDescriptor<T, Err>,
    value: T
  ) => TransformResult<T>;
};

type FieldTransformer<T, E, Err> = {
  type: "inner" | "outer";
  field: FieldDescriptor<T, Err>;
  transformers: Array<Falsy | Transformer<E>>;
  triggers?: TransformationTrigger[];
};

type TransformFn<Err> = {
  <T>(config: {
    field: FieldDescriptor<T, Err>;
    rules: Array<Falsy | Transformer<T>>;
    triggers?: TransformationTrigger[];
  }): FieldTransformer<T, T, Err>;

  each: <T>(config: {
    field: FieldDescriptor<T[], Err>;
    rules: Array<Falsy | Transformer<T>>;
    triggers?: TransformationTrigger[];
  }) => FieldTransformer<T, T, Err>;
};

/**
 * Create form transformer based on provided set of transformation rules.
 * The transformation includes filtering and mapping values (inside the same type).
 * You can also specify transformation triggers.
 *
 * @example
 * ```
 * const transformer = createForm.transformer(Schema, transform => [
 *  transform({
 *    field: Schema.age,
 *    rules: () => [round("ceil"), map(val => val * 2)],
 *  }),
 *  transform.each({
 *    field: Schema.promoCodes,
 *    rules: () => [toUpperCase(), trim()],
 *    triggers: ["blur"],
 *  }),
 *]);
 * ```
 */
export const createFormTransformer = <Values extends object, Err>(
  form: FormSchema<Values, Err>,
  builder: (
    transform: TransformFn<Err>
  ) => Array<FieldTransformer<any, any, Err>>
): FormTransformer<Values, Err> => {
  throw new Error("not implemented!");
};
