declare module "formts.c" {
  export const Fields: {
    string: any;
    choice: any;
    number: any;
    array: any;
    object: any;
  };

  export const Validators: {
    of: any;
    when: any;
    required: any;
    minValue: any;
    maxValue: any;
    minLength: any;
    maxLength: any;
    pattern: any;
  };

  export const Transformers: {
    map: any;
    trim: any;
    filter: any;
    integer: any;
    minValue: any;
    maxValue: any;
    minLength: any;
    maxLength: any;
    upperCase: any;
  };

  export const buildForm: <Ctx = {}>() => {
    withFields: <F>(
      fields: F
    ) => {
      Component: React.FC<{
        context: Ctx;
        initialValues: Partial<F>;
        onSubmit: (values: F) => void;
      }>;
      fields: F;
    };
  };

  export const useField: (
    field: any
  ) => {
    value: any;
    error: any;
    reduceError: any;
    setValue: any;
    parseEvent: any;
    handleBlur: any;
  };
}
