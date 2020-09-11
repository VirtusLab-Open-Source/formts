/**************************  UTILS  *************************/

class Tagged<T> {
  private __tag!: T;
}
type Nominal<Tag, T> = Tagged<Tag> & T;

type Primitive = string | number | boolean;

/**************************  DECODERS  *************************/

type FieldType = "number" | "string" | "choice" | "bool" | "array" | "object";

export type Decoder<T extends FieldType, V> = {
  type: T;
  decode: (value: unknown) => Decoder.Result<V>;
};

namespace Decoder {
  export type Result<T> =
    | { ok: true; value: T }
    | { ok: false; value: unknown };

  export type Extract<
    T extends Decoder<FieldType, unknown>
  > = T extends Decoder<FieldType, infer T> ? T : never;

  export const bool = (): Decoder<"bool", boolean> => ({
    type: "bool",
    decode: value => {
      switch (typeof value) {
        case "boolean":
          return { ok: true, value };
        case "string":
          switch (value.toLowerCase()) {
            case "true":
              return { ok: true, value: true };
            case "false":
              return { ok: true, value: false };
          }
        default:
          return { ok: false, value };
      }
    },
  });

  export const number = (): Decoder<"number", number | ""> => ({
    type: "number",
    decode: value => {
      switch (typeof value) {
        case "number":
        case "string": {
          if (value === "") {
            return { ok: true, value };
          }
          const num = Number(value);
          return Number.isNaN(num)
            ? { ok: false, value }
            : { ok: true, value: num };
        }
        default:
          return { ok: false, value };
      }
    },
  });

  export const string = (): Decoder<"string", string> => ({
    type: "string",
    decode: value => {
      switch (typeof value) {
        case "string":
          return { ok: true, value };
        case "number":
        case "boolean":
          return { ok: true, value: value.toString() };
        default:
          return { ok: false, value };
      }
    },
  });

  export const choice = <Opts extends string>(
    ...options: Opts[]
  ): Decoder<"choice", Opts | ""> => ({
    type: "choice",
    decode: value => {
      switch (typeof value) {
        case "string":
        case "number":
        case "boolean":
          const stringified = value.toString();
          return stringified === "" || options.includes(stringified as Opts)
            ? { ok: true, value: stringified as Opts }
            : { ok: false, value };
        default:
          return { ok: false, value };
      }
    },
  });

  export const array = <E>(
    innerDecoder: Decoder<FieldType, E>
  ): Decoder<"array", Array<E>> => ({
    type: "array",
    decode: value => {
      if (Array.isArray(value)) {
        const decodeResults = value.map(innerDecoder.decode);
        if (decodeResults.every(result => result.ok)) {
          return {
            ok: true,
            value: decodeResults.map(result => result.value as E),
          };
        }
      }
      return { ok: false, value };
    },
  });

  type ObjectDecoders = Record<string, Decoder<FieldType, any>>;
  type DecodedObject<O extends ObjectDecoders> = {
    [K in keyof O]: Decoder.Extract<O[K]>;
  };
  export const object = <O extends ObjectDecoders>(
    innerDecoders: O
  ): Decoder<"object", DecodedObject<O>> => ({
    type: "object",
    decode: value => {
      if (typeof value !== "object" || value == null) {
        return { ok: false, value };
      }

      const decodedObject = {} as DecodedObject<O>;
      for (let key of Object.keys(innerDecoders)) {
        const result = innerDecoders[key].decode((value as any)[key]);
        if (!result.ok) {
          return { ok: false, value };
        } else {
          decodedObject[key as keyof typeof innerDecoders] = result.value;
        }
      }

      return { ok: true, value: decodedObject };
    },
  });
}

////////////////////////////////

const boolean = Decoder.bool();
const number = Decoder.number();
const string = Decoder.string();
const choice = Decoder.choice("A", "B", "C");
const array = Decoder.array(Decoder.string());
const object = Decoder.object({
  boolean: Decoder.bool(),
  number: Decoder.number(),
  string: Decoder.string(),
  choice: Decoder.choice("A", "B", "C"),
  array: Decoder.array(Decoder.string()),
});
const nestedArray = Decoder.array(
  Decoder.object({
    arr: Decoder.array(Decoder.object({})),
  })
);

/**************************  FIELD DEFINITION  *************************/

type GenericValidationShape<Value> = Record<string, Validator<Value, any, any>>;

type RawFieldDefinition<
  Value,
  Type extends FieldType = FieldType,
  Validators extends GenericValidationShape<Value> = {}
> = {
  decoder: Decoder<Type, Value>;
  validators: Validators;
};

type FieldDefinition<
  Value,
  Form,
  Type extends FieldType = FieldType,
  Validators extends GenericValidationShape<Value> = {}
> = RawFieldDefinition<Value, Type, Validators> & {
  path: string;
  __formShape__: Form;
};

const defineField = () => ({
  // TODO
});

/**************************  VALIDATORS  *************************/

type Validator<Value, Form, Meta> = Nominal<
  "Validator",
  {
    dependencies: () => Array<FieldDefinition<unknown, Form>>;
    run: (
      value: Value,
      fieldGetter: <T>(field: FieldDefinition<T, Form>) => T
    ) => Validator.Result<Meta>;
  }
>;

namespace Validator {
  export type Result<Meta = {}> = { ok: boolean } & Meta;

  /** internal validator constructor that works around nominal typing */
  const create = <V, F, M = void>(validate: (value: V) => boolean, meta: M) => {
    const validator: Pick<Validator<V, F, M>, "run" | "dependencies"> = {
      dependencies: () => [],
      run: value =>
        validate(value) ? { ok: true, ...meta } : { ok: false, ...meta },
    };

    return validator as Validator<V, F, M>;
  };

  export const required = <T extends Primitive, F>() =>
    create<T, F>(value => {
      switch (typeof value) {
        case "boolean":
          return value;
        case "string":
        case "number":
          return value !== "";
      }
    }, undefined);

  export const minLength = <T extends string | Array<any>, F>(min: number) =>
    create<T, F, { min: number }>(
      value => value === "" || value.length >= min,
      { min }
    );

  export const maxLength = <T extends string | Array<any>, F>(max: number) =>
    create<T, F, { max: number }>(
      value => value === "" || value.length <= max,
      { max }
    );

  type Of = {
    <V, M, F>(validate: (value: V) => Validator.Result<M>): Validator<V, F, M>;
    <V, M, F, D1>(
      validate: (value: V, dep1: D1) => Validator.Result<M>,
      dependencies: () => [FieldDefinition<D1, F>]
    ): Validator<V, F, M>;
    <V, M, F, D1, D2>(
      validate: (value: V, dep1: D1, dep2: D2) => Validator.Result<M>,
      dependencies: () => [FieldDefinition<D1, F>, FieldDefinition<D2, F>]
    ): Validator<V, F, M>;
    /// ...
  };
  export const of: Of = <V, F, M>(
    validate: (value: V, ...deps: unknown[]) => Validator.Result<M>,
    dependencies: () => Array<FieldDefinition<unknown, F>> = () => []
  ) => {
    const validator: Pick<Validator<V, F, M>, "run" | "dependencies"> = {
      dependencies,
      run: (value, fieldGetter) => {
        const resolvedDependencies = dependencies().map(fieldGetter);
        return validate(value, ...resolvedDependencies);
      },
    };

    return validator as Validator<V, F, M>;
  };
}

////////////////////////////////

const ImaginaryForm1 = {
  gender: {} as FieldDefinition<
    "string",
    { gender: true; age: true },
    "string",
    {}
  >,
  age: {} as FieldDefinition<
    "string",
    { gender: true; age: true },
    "string",
    {}
  >,
};
const ImaginaryForm2 = {
  name: {} as FieldDefinition<
    "string",
    { name: true; surname: true },
    "string",
    {}
  >,
  surname: {} as FieldDefinition<
    "string",
    { name: true; surname: true },
    "string",
    {}
  >,
};

const v1 = Validator.required();
const v2 = Validator.minLength(1);
const v3 = Validator.of(
  (height, gender) => {
    // custom validator
    return { ok: false, foo: 42 };
  },
  () => [ImaginaryForm1.age]
);
const v4 = Validator.of((height: string) => {
  // custom validator
  if (2 > 1) {
    return { ok: false, bar: "as" };
  }

  return { ok: false, foo: 42 };
});
export {};

///

type C_FieldDef<C> = { ctx: Partial<C> };

declare const c_field: {
  string: () => {
    validate: <C>(b: (ctx: C) => string[]) => C_FieldDef<C>;
  };
};

declare const c_form: <C>() => <F extends Record<string, C_FieldDef<C>>>(
  fields: F
) => F;

const f1 = c_field.string().validate(ctx => []);
const f2 = c_field.string().validate<{ foo: string }>(ctx => []);
const f3 = c_field.string().validate<{ foo: string; bar: number }>(ctx => []);

const fo1 = c_form<{ foo: string; bar: number }>()({
  f1,
  f2,
  f3,
  f4: c_field.string().validate(ctx => []),
});

const fo2 = c_form()({
  f1,
  f2,
  f3,
  f4: c_field.string().validate(ctx => []),
});
