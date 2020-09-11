import { assert, IsAny } from "conditional-type-checks";

type NoInfer<A> = [A][A extends any ? 0 : never];

const buildForm = <Ctx>() => ({
  withFields: <F extends Record<string, Field<any, Ctx, any>>>(fields: F): F =>
    fields,
});

const typeMarker = <T>() => (undefined as any) as T;

type Validator<
  T,
  K extends string,
  R extends { ok: boolean } = { ok: boolean }
> = ((val: T) => R) & { __vk: K };
namespace Validator {
  export const of = <
    T,
    K extends string,
    R extends { ok: boolean } = { ok: boolean }
  >(
    key: K,
    fn: (val: T) => R
  ): Validator<T, K, R> => Object.assign(fn, { __vk: key });

  export const required = <T>() =>
    Validator.of("required", (val: T) =>
      val == null || (val as any) === "" ? { ok: false } : { ok: true }
    );

  export const minVal = (min: number) =>
    Validator.of("minVal", (val: number) =>
      val < min ? { ok: false, min } : { ok: true }
    );
}

type ValidateIn<Ctx, T, K extends string, R extends { ok: boolean }, D1> = (
  ctx: Ctx,
  d1: D1
) => Validator<T, K, R>;

type ValidateConfig<D1> = {
  deps: () => [Field<D1, any, any>];
};

type Validate = {
  <Ctx, T, K extends string, R extends { ok: boolean }, D1>(
    validators: ValidateIn<Ctx, T, K, R, D1>,
    opts: ValidateConfig<D1>
  ): any;
};

type Field<T, Ctx, Err extends Record<string, { ok: boolean }>> = {
  __ctx: Partial<Ctx>;
  __type: T;
  __err: Err;
};

const Fields = {
  number: () => ({
    validate: <Ctx, K extends string, R extends { ok: boolean }, D1>(
      input: ValidateIn<Ctx, number, K, R, NoInfer<D1>>,
      opts: ValidateConfig<D1>
    ): Field<number, Ctx, Record<K, R>> => ({
      __ctx: typeMarker<Ctx>(),
      __type: typeMarker<number>(),
      __err: typeMarker<Record<K, R>>(),
    }),
  }),

  string: () => ({
    validate: <Ctx, K extends string, R extends { ok: boolean }, D1>(
      input: ValidateIn<Ctx, number, K, R, NoInfer<D1>>,
      opts: ValidateConfig<D1>
    ): Field<string, Ctx, Record<K, R>> => ({
      __ctx: typeMarker<Ctx>(),
      __type: typeMarker<string>(),
      __err: typeMarker<Record<K, R>>(),
    }),
  }),

  bool: () => ({
    validate: <Ctx, K extends string, R extends { ok: boolean }, D1>(
      input: ValidateIn<Ctx, boolean, K, R, NoInfer<D1>>,
      opts: ValidateConfig<D1>
    ): Field<boolean, Ctx, Record<K, R>> => ({
      __ctx: typeMarker<Ctx>(),
      __type: typeMarker<boolean>(),
      __err: typeMarker<Record<K, R>>(),
    }),
  }),
};

const fieldA = Fields.string().validate((ctx, b) => Validator.required(), {
  deps: () => [fieldB],
});

const fieldB = Fields.number().validate((ctx, c) => Validator.minVal(10), {
  deps: () => [fieldC],
});

const fieldC = Fields.bool().validate((ctx, a) => Validator.required(), {
  // deps: () => [fieldA],
  deps: () => [] as any,
});

const Form1 = buildForm<{ api: any }>().withFields({
  age: Fields.number().validate((ctx, name) => Validator.minVal(10), {
    deps: () => {
      const eh = Form1.age;
      return ["whatsgoingon?" as any];
    },
  }),

  name: Fields.string().validate((ctx, age) => Validator.required(), {
    deps: () => [1 as any],
  }),
});

if (Form1.age.__err.minVal.ok == false) {
  Form1.age.__err.minVal.min; // ✨
}

////
namespace Test1 {
  const fn = <F extends Record<string, Function>>(fields: F) => fields;

  const fields = fn({
    a: () => fields.b,
    b: () => fields.a,
  });

  assert<IsAny<typeof fields>>(false); // OK!
}

namespace Test2 {
  type Field<T> = {
    __type: T;
  };

  const field = <T>(): Field<T> => ({
    __type: typeMarker<T>(),
  });

  const builder = <F extends Record<string, () => Field<any>>>(fields: F) =>
    fields;

  const fields = builder({
    a: () => field<"">(),
    b: () => field<"b">(),
    c: () => fields.a,
  });

  assert<IsAny<typeof fields>>(false); // Error!
}

////
namespace Test3 {
  type Field<T> = {
    __type: T;
  };

  const field = <T>() => <D>(dep: () => Field<D> | null): Field<T> => ({
    __type: typeMarker<T>(),
  });

  const builder = <F extends Record<string, Field<any>>>(fields: F) => fields;

  const a = field<"a">()(() => b);
  const b = field<"b">()(() => c);
  const c = field<"c">()(() => a);

  assert<IsAny<typeof a>>(false); // Error!
  assert<IsAny<typeof b>>(false); // Error!
  assert<IsAny<typeof c>>(false); // Error!

  const fields = builder({
    str: field<string>()(() => fields.num),
    num: field<number>()(() => null),
    bool: field<boolean>()(() => null),
  });

  assert<IsAny<typeof fields>>(false); // Error!
}

namespace Test4 {
  type Field<FV, T> = {
    __type: T;
    __formValues: FV;
  };

  type FormValues<FormFields extends Record<string, Field<any, any>>> = {
    [K in keyof FormFields]: FormFields[K]["__type"];
  };

  type FormFields<FormValues extends Record<string, any>> = {
    [K in keyof FormValues]: Field<FormValues, FormValues[K]>;
  };

  const Fields = {
    number: () => ({
      validate: <FV>(fn: (val: number) => boolean): Field<FV, number> => ({
        __type: typeMarker<number>(),
        __formValues: typeMarker<FV>(),
      }),
    }),
    string: () => ({
      validate: <FV, D1>(
        opts: {
          deps: (fields: FormFields<FV>) => Field<FV, D1>;
        },
        fn: (val: string, d1: D1) => boolean
      ): Field<FV, string> => ({
        __type: typeMarker<string>(),
        __formValues: typeMarker<FV>(),
      }),
    }),
    bool: () => ({
      validate: <FV, D1, D2>(
        opts: {
          deps: (fields: FormFields<FV>) => [Field<FV, D1>, Field<FV, D2>];
        },
        fn: (val: boolean, d1: D1, d2: D2) => boolean
      ): Field<FV, boolean> => ({
        __type: typeMarker<boolean>(),
        __formValues: typeMarker<FV>(),
      }),
    }),
  };

  const builder = <F>(fields: FormFields<F>) => fields;

  type Values = {
    num: number;
    str: string;
    bool: boolean;
  };

  const fields = builder<Values>({
    num: Fields.number().validate(val => val === 42),
    str: Fields.string().validate(
      { deps: fields => fields.num },
      (val, num) => val === "42" && num === 42
    ),
    bool: Fields.bool().validate(
      { deps: fields => [fields.str, fields.num] },
      (val, str, num) => val === true && str === "42" && num === 42
    ),
  });

  assert<IsAny<typeof fields>>(false); // Ok!
}

namespace Yeeey {
  const fields = builder<Values>({
    num: {
      transform: (e: Event) => Number(e.target.value),
      validate: val => ({ ok: val === 42 }),
    },
    str: {
      validate: [v.required(), v.minLength(10)],
      deps: fields => fields.num,
    },
    choice: {
      validate: [
        { test: v.required(), runOn: ["change", "submit"] },
        {
          test: async (value, numField) => {
            /// stuff
            return { ok: false, error: "asyncValidateErr", foo: "bar" };
          },
          runOn: ["blur"],
        },
        v.maxLength(100),
      ],
      deps: fields => fields.num,
    },
  });

  type ChoiceValidationResult =
    | { error: false }
    | { error: "required" }
    | { error: "asyncValidateErr"; foo: "bar" }
    | { error: "maxLength"; max: 100 };

  declare const result: ChoiceValidationResult;

  switch (result.error) {
    case "asyncValidateErr":
      console.log(result.foo);
  }

  const fields = builder<Values>(field => ({
    num: {
      transform: (e: Event) => Number(e.target.value),
      validate: val => ({ ok: val === 42 }),
    },
    str: {
      validate: [v.required(), v.minLength(10)],
      deps: fields => fields.num,
    },
    choice: {
      validate: [
        { test: v.required(), runOn: ["change", "submit"] },
        {
          test: async (value, numField) => {
            /// stuff
            return { ok: true, foo: 42 };
          },
          runOn: ["blur"],
        },
        v.maxLength(100),
      ],
      deps: fields => fields.num,
    },
  }));
}

namespace Test5 {
  type Field<T, F> = {
    __type: T;
    __form: F;
  };

  type FieldRef<T, F> = {
    __ref: T;
    __form: F;
  };

  type FormValues<F extends Record<string, Field<any, any>>> = {
    [K in keyof F]: F[K]["__type"];
  };

  const field = <F>() => <T>() => <D>(
    dep: FieldRef<D, F> | null
  ): Field<T, F> => ({
    __type: typeMarker<T>(),
    __form: typeMarker<F>(),
  });

  const ref = <Form, Key extends keyof Form>(
    fieldName: Key
  ): FieldRef<Form[Key], Form> => ({
    __ref: typeMarker<Form[Key]>(),
    __form: typeMarker<Form>(),
  });

  const builder = <F extends Record<string, Field<any, FormValues<F>>>>(
    fields: F
  ) => fields;

  // type V can not be inferred
  type V = {
    str: string;
    num: number;
    bool: boolean;
  };

  const fields = builder({
    str: field<V>()<string>()(ref("num")),
    num: field<V>()<number>()(ref("bool")),
    bool: field<V>()<boolean>()(ref("str")),
  });

  assert<IsAny<typeof fields>>(false);
}
