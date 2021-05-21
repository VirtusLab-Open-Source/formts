import { FormSchema } from "../../types/form-schema";

import { createFormSchema, DecodersMap } from "./create-schema";

/**
 * Builds schema which defines shape of the form values and type of validation errors.
 * The schema is used not only for compile-time type-safety but also for runtime validation of form values.
 * The schema can be defined top-level, so that it can be exported to nested Form components for usage together with `useField` hook.
 *
 * @returns
 * FormSchema - used to interact with Formts API and point to specific form fields
 *
 * @example
 * ```
 * import { FormSchemaBuilder, FormFields } from "@virtuslab/formts"
 *
 * const Schema = new FormSchemaBuilder()
 *   .fields({
 *     name: FormFields.string(),
 *     age: FormFields.number(),
 *   })
 *   .errors<string>()
 *   .build()
 * ```
 */
export class FormSchemaBuilder {
  private decoders: DecodersMap<any> = {} as any;

  /**
   * Builds schema which defines shape of the form values and type of validation errors.
   * The schema is used not only for compile-time type-safety but also for runtime validation of form values.
   * The schema can be defined top-level, so that it can be exported to nested Form components for usage together with `useField` hook.
   *
   * @returns
   * FormSchema - used to interact with Formts API and point to specific form fields
   *
   * @example
   * ```
   * import { FormSchemaBuilder, FormFields } from "@virtuslab/formts"
   *
   * const Schema = new FormSchemaBuilder()
   *   .fields({
   *     name: FormFields.string(),
   *     age: FormFields.number(),
   *   })
   *   .errors<string>()
   *   .build()
   * ```
   */
  constructor() {}

  /**
   * Define form fields as dictionary of decoders. Use `FormFields` import.
   *
   * @example
   * ```
   * new FormSchemaBuilder()
   *   .fields({
   *     name: FormFields.string(),
   *     age: FormFields.number(),
   *   })
   * ```
   */
  fields = <V extends object>(fields: DecodersMap<V>) => {
    this.decoders = fields;

    return (this as any) as SchemaBuilder$Fields<V>;
  };

  /**
   * Define form errors to be used by `FormValidatorBuilder`.
   *
   * @example
   * ```
   * new FormSchemaBuilder()
   *   .errors<MyErrorCodesEnum>()
   * ```
   */
  errors = <Err>() => {
    return (this as any) as SchemaBuilder$Errors<Err>;
  };

  // @ts-ignore
  private build = () => createFormSchema(this.decoders);
}

interface SchemaBuilder$Errors<Err> {
  /**
   * Define form fields as dictionary of decoders. Use `FormFields` import.
   *
   * @example
   * ```
   * new FormSchemaBuilder()
   *   .fields({
   *     name: FormFields.string(),
   *     age: FormFields.number(),
   *   })
   * ```
   */
  fields: <V extends object>(
    fields: DecodersMap<V>
  ) => SchemaBuilder$Complete<V, Err>;
}

interface SchemaBuilder$Fields<V extends object> {
  /**
   * Define form errors to be used by `FormValidatorBuilder`.
   *
   * @example
   * ```
   * new FormSchemaBuilder()
   *   .errors<MyErrorCodesEnum>()
   * ```
   */
  errors: <Err>() => SchemaBuilder$Complete<V, Err>;

  /** finalize construction of `FormSchema` */
  build: () => FormSchema<V, never>;
}

interface SchemaBuilder$Complete<V extends object, Err> {
  /** finalize construction of `FormSchema` */
  build: () => FormSchema<V, Err>;
}
