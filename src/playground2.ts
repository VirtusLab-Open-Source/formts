// utils
type Unwrap<T> = T extends PromiseLike<infer U> ? U : T;
type Promisable<T> = T | Promise<T>;
type NoInfer<A> = [A][A extends any ? 0 : never];
const typeMarker = <T>() => (undefined as any) as T;
//

type Validator<T, P> = (val: T) => Promisable<{ ok: boolean } & P>;

namespace Validator {
  /** create validator that runs all given validators at the same time */
  export const compose = <
    T,
    V extends Record<string, Validator<T, { ok: boolean }>>
  >(
    validators: V
  ) => (val: T) => {
    const results = {} as { [K in keyof V]: Unwrap<ReturnType<V[K]>> };
    let ok = true;
    const promises = Object.keys(validators).map((key: keyof V) => {
      const validator = validators[key];
      const promise = Promise.resolve(validator(val)).then(result => {
        results[key] = result as any;
        if (!result.ok) {
          ok = false;
        }
      });
      return promise;
    });
    return Promise.all(promises).then(() => ({ ok, ...results }));
  };

  export const required = () => (val: any) => ({
    ok: val == null || val === "" || val === false,
  });

  export const minValue = (min: number) => (val: number) => ({
    ok: !required()(val).ok || val >= min,
    min,
  });

  export const maxValue = (max: number) => (val: number) => ({
    ok: !required()(val).ok || val <= max,
    max,
  });

  export const minLength = (min: number) => (val: string | Array<unknown>) => ({
    ok: !required()(val).ok || val.length >= min,
    min,
  });

  export const maxLength = (max: number) => (val: string | Array<unknown>) => ({
    ok: !required()(val).ok || val.length <= max,
    max,
  });
}

type Schema<T> = T extends Array<any>
  ? ArrayFieldSchema<T>
  : T extends object
  ? ObjectFieldSchema<T>
  : FieldSchema<T>;
type ArrayFieldSchema<T extends Array<unknown>> = {
  root: FieldSchema<T>;
  each: Schema<T[number]>;
};
type ObjectFieldSchema<T extends object> = { root: FieldSchema<T> } & {
  [K in keyof T]: Schema<T[K]>;
};
type FormSchema<Values extends object> = Omit<
  ObjectFieldSchema<Values>,
  "root"
>;

type FieldSchema1<
  T,
  Validators extends Record<string, Validator<T, { ok: boolean }>> = {}
> = {
  validate?: Validators;
};
type FieldSchema<
  T,
  Validators extends { [key: string]: Validator<T, { ok: boolean }> } = {}
> = {
  validate?: Validators;
};

type FieldControllers<Schema> = Schema;

type FormController<Schema> = {
  fields: FieldControllers<Schema>;
};

export const useForm = <Values extends object>() => <
  Schema extends FormSchema<Values>
>(
  schema: Schema
): FormController<Schema> => {
  throw "TODO";
};

type Values = {
  num: number;
  choice: "A" | "B" | "C";
  arr: string[];
  nested: {
    num: number;
    choice: "A" | "B" | "C";
    arr: string[];
  };
};

const field = <T, V extends { [key: string]: Validator<T, { ok: boolean }> }>(
  config: FieldSchema<T, V> = {}
): FieldSchema<T, V> => config;

const fieldBuilder = <
  T,
  V extends { [key: string]: Validator<T, { ok: boolean }> }
>() => ({
  validate: (validate: V): FieldSchema<T, V> => ({ validate }),
});

const u1 = useForm<Values>()({
  num: field({
    validate: {
      required: Validator.required(),
      minVal: Validator.minValue(10),
      custom: (val: number) => ({ ok: val === 1, foo: 3 }),
    },
  }),
  choice: fieldBuilder().validate({
    required: Validator.required(),
    custom: (val: string) => ({ ok: val === "A", foo: 3 }),
  }),
  arr: {
    root: field(),
    each: {
      validate: {
        inferenceIsHardIGuess: (notReallyADate: Date) => ({ ok: false }),
      },
    },
  },
  nested: {
    root: field(),
    num: field(),
    choice: field(),
    arr: {
      root: field(),
      each: field(),
    },
  },
});
