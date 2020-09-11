declare module "formts.a" {
  export const define: {
    form: <F>(fields: F) => F;
    validator: any;
    transformer: any;
  };

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

  export const Formts: React.FC<any>;

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
