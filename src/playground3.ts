import { Validators } from "formts.c";

// utils
type Unwrap<T> = T extends PromiseLike<infer U> ? U : T;
type Promisable<T> = T | Promise<T>;
type NoInfer<A> = [A][A extends any ? 0 : never];
const typeMarker = <T>() => (undefined as any) as T;

// Validator

type Validator<T, Err extends string, R extends Validator.Result<Err>> = {
  (val: T): Promisable<R>;
  config: Validator.Config;
};

namespace Validator {
  export type Trigger = "change" | "blur" | "submit";
  export type Config = { runOn?: Trigger[] };
  export type Result<Err extends string> = { error: null } | { error: Err };
  export type ExtractResult<V> = V extends Validator<any, any, infer R>
    ? R
    : never;

  export const of = <T, Err extends string, R extends Validator.Result<Err>>(
    fn: (val: T) => Promisable<R>,
    config: Validator.Config = {}
  ): Validator<T, Err, R> => Object.assign(fn, { config });

  export const required = () =>
    Validator.of((val: any) =>
      val == null || val === "" || val === false
        ? { error: "required" }
        : { error: null }
    );

  export const optional = () =>
    Validator.of((val: any) => {
      if (val == null || val === "" || val === false) {
        throw true; // cut validation chain?
      }
      return { error: null };
    });

  export const minValue = (min: number) =>
    Validator.of((val: number) =>
      val < min ? { error: "minValue", min } : { error: null }
    );
  export const maxValue = (max: number) =>
    Validator.of((val: number) =>
      val > max ? { error: "maxValue", max } : { error: null }
    );

  export const minLength = (min: number) =>
    Validator.of((val: string | Array<unknown>) =>
      val.length < min ? { error: "minLength", min } : { error: null }
    );
  export const maxLength = (max: number) =>
    Validator.of((val: string | Array<unknown>) =>
      val.length > max ? { error: "maxLength", max } : { error: null }
    );
}

// Transform

type Transform<A, B = A> = (a: A) => Transform.Result<B>;

namespace Transform {
  export type Result<T> = { is: "some"; value: T } | { is: "none" };

  export const filter = <T>(
    predicate: (value: T) => boolean
  ): Transform<T> => value =>
    predicate(value) ? { is: "some", value } : { is: "none" };

  export const map = <A, B>(
    mapper: (value: A) => B
  ): Transform<A, B> => value => ({ is: "some", value: mapper(value) });
}

// field

type FieldConfig<
  X,
  V extends Array<Validator<X, any, any>> = any[],
  T extends Array<Transform<any, any>> = any[]
> = {
  __type: X;
  validators: V;
  transform: T;
};

class FieldBuilder<
  X,
  V extends Array<Validator<X, any, any>> = any[],
  T extends Array<Transform<any, any>> = any[]
> {
  static of<X>() {
    return new FieldBuilder<X>([], []);
  }

  private constructor(private validators: V, private transformers: T) {}

  validate<V extends Array<Validator<X, any, any>>>(...validators: V) {
    return new FieldBuilder<X, V, T>(validators, this.transformers);
  }

  transform<A, B>(t1: Transform<A, B>, t2: Transform<B, X>) {
    return new FieldBuilder<X, V, [Transform<A, B>, Transform<B, X>]>(
      this.validators,
      [t1, t2]
    );
  }
}

const field = <T>() => FieldBuilder.of<T>();

// const field = <Val>() => {
//   const builder = <T extends FieldConfig<Val, any, any>>(fieldConfig: T) => ({
//     __type: typeMarker<Val>(),
//     build: () => fieldConfig,
//   });

//   return builder({ __type: typeMarker<Val>(), validators: [], transform: [] });
// };

// deprecated

type FieldBuilderOld = {
  <T>(): FieldConfig<T, [], []>;

  <T, V extends Array<Validator<T, any, any>>>(config: {
    validators: V;
  }): FieldConfig<T, V, []>;

  <T, A>(config: { transform: [Transform<T, A>] }): FieldConfig<
    T,
    [],
    [Transform<T, A>]
  >;

  <T, A, B>(config: {
    transform: [Transform<T, A>, Transform<A, B>];
  }): FieldConfig<T, [], [Transform<T, A>, Transform<A, B>]>;

  <T, A, B, C>(config: {
    transform: [Transform<T, A>, Transform<A, B>, Transform<B, C>];
  }): FieldConfig<T, [], [Transform<T, A>, Transform<A, B>, Transform<B, C>]>;
};

const fieldOld = (<T>(config?: {
  validators: Array<Validator<T, any, any>>;
  transform: Array<Transform<any, any>>;
}) => ({
  __type: typeMarker<T>(),
  validators: (config?.validators || []) as any,
  transform: (config?.transform || []) as any,
})) as FieldBuilderOld;

// schema

type GenericSchema<T> = T extends Array<any>
  ? ArrayFieldSchema<T>
  : T extends object
  ? ObjectFieldSchema<T>
  : FieldBuilder<T>;
type ArrayFieldSchema<T extends Array<unknown>> = {
  root: FieldBuilder<T>;
  each: GenericSchema<T[number]>;
};
type ObjectFieldSchema<T extends object> = { root: FieldBuilder<T> } & {
  [K in keyof T]: GenericSchema<T[K]>;
};
type FormSchema<Values extends object> = Omit<
  ObjectFieldSchema<Values>,
  "root"
>;

// field controller

type FormController<Schema extends object> = {
  fields: FieldControllers<Schema>;
};

type FieldControllers<Schema> = Schema extends FieldBuilder<any>
  ? FieldController<Schema>
  : Schema extends object
  ? { [K in keyof Schema]: FieldControllers<Schema[K]> }
  : never;

type FieldController<S> = S extends FieldBuilder<infer T, infer V>
  ? {
      value: T;
      validationResult: FieldError<V>;
      validating: boolean;
      setValue: (val: T) => void;
      blur: () => void;
    }
  : never;

type FieldError<V> = V extends ReadonlyArray<Validator<any, any, any>>
  ? Extract<Unwrap<ReturnType<V[number]>>, { error: string }> | { error: null }
  : never;

// hooks

export const useForm = <Values extends object>() => <
  Schema extends FormSchema<Values>
>(
  schema: Schema
): FormController<Schema> => {
  throw "TODO";
};

// example

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

const form = useForm<Values>()({
  // num: fieldOld({
  //   validators: [
  //     Validator.required(),
  //     Validator.minValue(10),
  //     Validator.of(
  //       (val: number) =>
  //         val === 42
  //           ? { error: null }
  //           : { error: "notTheAnswer", realAnswer: 42 },
  //       { runOn: ["blur"] }
  //     ),
  //   ],
  // }),
  num: field<number>().validate(
    Validator.required(),
    Validator.minValue(10),
    Validator.of(
      (val: number) =>
        val === 42
          ? { error: null }
          : { error: "notTheAnswer", realAnswer: 42 },
      { runOn: ["blur"] }
    )
  ),
  choice: field<Values["choice"]>().transform(
    (a: string) => ({ is: "some", value: +a }),
    Transform.map(it => (it > 1 ? "A" : "B"))
  ),
  arr: {
    root: field(),
    each: field(),
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

const { validationResult } = form.fields.num;
if (validationResult.error === "notTheAnswer") {
  console.log(validationResult.realAnswer);
}

form.fields.choice.validationResult;

// builder playground

const builder = () => {
  const _builder = <T extends object>(ctx: T) => ({
    stringProp: <Key extends string>(name: Key) =>
      _builder<T & { [K in Key]: string }>(ctx as any),

    numberProp: <Key extends string>(name: Key) =>
      _builder<T & { [K in Key]: number }>(ctx as any),

    build: () => ctx,
  });

  return _builder<{}>({});
};

const res = builder()
  .numberProp("foo")
  .stringProp("bar")
  .numberProp("baz")
  .build();
