export type FieldError<Err> = {
  /**
   * ID string that enables connecting the error to a specific field.
   * Use `FieldMatcher` helper class to compare it against FieldDescriptor objects from your form schema.
   */
  fieldId: string;
  error: Err;
};
