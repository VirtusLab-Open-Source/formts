declare module "formts.b" {
  export const fields: {
    string: any;
    choice: any;
    number: any;
    array: any;
    object: any;
  };

  export const validators: {
    test: any;
    when: any;
    required: any;
    minValue: any;
    maxValue: any;
    minLength: any;
    maxLength: any;
    pattern: any;
  };

  export const transformers: {
    map: any;
    filter: any;
    integer: any;
    minValue: any;
    maxValue: any;
    minLength: any;
    maxLength: any;
    upperCase: any;
  };

  export const useForm: <F>(
    fields: F,
    deps: any[]
  ) => { fields: F; handleSubmit: any; values: any; errors: any };

  export type FieldDescriptor<T> = any & T;
}
