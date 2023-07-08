[![build status](https://circleci.com/gh/VirtusLab-Open-Source/formts.svg?style=shield)](https://app.circleci.com/pipelines/github/VirtusLab-Open-Source/formts)
[![GitHub license](https://img.shields.io/github/license/VirtusLab/formts)](https://github.com/VirtusLab/formts/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/@virtuslab/formts)](https://www.npmjs.com/package/@virtuslab/formts)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@virtuslab/formts)](https://bundlephobia.com/result?p=@virtuslab/formts)
[![examples](https://img.shields.io/badge/examples-codesandbox-blue)](https://github.com/VirtusLab/formts#examples)

# Formts

**Type-safe, declarative and performant React form & validation library**

### Status

**A stable release has been reached.** Further development of new features is
currently not planned. Bug fixes will be provided if needed, feature requests
wil still be considered.

### Features

- Fully type-safe API, purpose built to get the most out of Typescript
  type-inference
- Declarative definition of form shape and validation rules
- Runtime type-checking of form values against the schema
- Convenient hooks & context based API allowing for isolated re-renders
- Plain react-typescript, 0 dependencies
- View layer agnostic - no components are provided, works with any 3rd-party
  components
- `handleChange` function for dealing with change events automatically
- Advanced validation API which enables:
  - specifying dependencies on other fields
  - specifying validation triggers for individual rules
  - selective validation of just the affected fields on value changes
  - separation of error messages from error codes (optional)
  - async validation rules with debounce option
  - easy mixing of built-in rules with custom functions
  - combining multiple validation rules into composite validators
- Good scalability for very large and complex forms

### Getting Started

#### 1) Install

```bash
npm install @virtuslab/formts
```

#### 2) Define shape of the form

```ts
import { FormSchemaBuilder, FormFields } from "@virtuslab/formts";

const Schema = new FormSchemaBuilder()
  .fields({ answer: FormFields.string() })
  .errors<string>()
  .build();
```

#### 3) Define validation rules (optional)

```ts
import { FormValidatorBuilder } from "@virtuslab/formts";

const validator = new FormValidatorBuilder(Schema)
  .validate(
    Schema.answer,
    val => (val === "" ? "Required!" : null),
    val => (val !== "42" ? "Wrong answer!" : null)
  )
  .build();
```

#### 3) Create controller holding form state

```tsx
import { useFormController, FormProvider } from "@virtuslab/formts";

const MyForm: React.FC = () => {
  const controller = useFormController({ Schema, validator });

  return (
    <FormProvider controller={controller}>
      <AnswerField />
      <FormActions />
    </FormProvider>
  );
};
```

#### 4) Connect inputs to form

```tsx
import { useField } from "@virtuslab/formts";

const AnswerField: React.FC = () => {
  const field = useField(Schema.answer);

  return (
    <section>
      <label htmlFor={field.id}>
        What is the answer to the meaning of life, the universe, and everything?
      </label>
      <input
        id={field.id}
        value={field.value}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
      />
      <div className="error">{field.error}</div>
    </section>
  );
};
```

#### 5) Connect actions to form

```tsx
import { useFormHandle } from "@virtuslab/formts";

const FormActions: React.FC = () => {
  const form = useFormHandle(Schema);

  return (
    <section>
      <button
        type="submit"
        disabled={form.isValid === false}
        onClick={() => form.submit(console.log)}
      >
        Submit!
      </button>

      <button type="reset" onClick={form.reset}>
        Reset
      </button>
    </section>
  );
};
```

### Documentation

Currently API documentation is available in form of:

- exhaustive JSDocs
- [TYPEDOC docs](https://virtuslab-open-source.github.io/formts/)
- CodeSandbox examples

### Examples

Play around with the code on _CodeSandbox_ to learn _Formts_ API and features:

a) Step-by-step introduction:

1. [basic form (naive)](https://codesandbox.io/s/intro-01-basic-form-naive-vplnc?file=/src/example.tsx)
2. [basic form + optimized re-renders](https://codesandbox.io/s/intro-02-basic-form-optimised-re-renders-r6mrc?file=/src/example.tsx)
3. [basic form + validation](https://codesandbox.io/s/intro-03-basic-form-validation-nhsg7?file=/src/example.tsx:770-795)
4. [basic form + Material-UI](https://codesandbox.io/s/intro-04-basic-form-material-ui-e0kkl?file=/src/example.tsx)

b) HTML input bindings:

1. [radio group input](https://codesandbox.io/s/inputs-radio-group-4l1pu?file=/src/example.tsx)
2. [checkbox group input](https://codesandbox.io/s/inputs-checkbox-group-t0mqb?file=/src/example.tsx)
3. [select input](https://codesandbox.io/s/inputs-select-1twl4?file=/src/example.tsx)
4. [input array](https://codesandbox.io/s/inputs-field-arrays-005tl?file=/src/example.tsx)
5. [mui multi-select input](https://codesandbox.io/s/inputs-mui-multi-select-lczxy?file=/src/example.tsx)
6. [mui date-picker input](https://codesandbox.io/s/inputs-mui-date-picker-x21vz?file=/src/example.tsx)

c) Advanced examples:

1. [change password form](https://codesandbox.io/s/change-password-form-yn1yz?file=/src/example.tsx)
2. [order pizza form](https://codesandbox.io/s/order-pizza-form-czt6cw?file=/src/order-pizza-form.tsx)
3. [form with summary of validation errors](https://codesandbox.io/s/form-with-summary-of-validation-errors-r44usv?file=/src/example.tsx)
4. [registration stepper form](https://codesandbox.io/s/registration-stepper-form-8c3jdm?file=/src/registration-stepper-form.tsx)

### Why another form lib?

#### Update 2023:

Some of the reasons outlined below are no longer valid as
[react-hook-form](https://github.com/react-hook-form/react-hook-form) has
improved since this project started. It offers good type-safety and performance.
If for some reason you are not happy with it however, this library offers
different approach to many aspects of form management and a powerful validation
API - so it may suit your needs better.

#### a) Type-safety

Most popular form libraries like `Formik` and `react-hook-form` are written in
Typescript but are not _designed_ with type-safe API as a primary concern.

There is some evidence that this is important for some people:

- [Reddit: Fully type-safe form libraries?](https://www.reddit.com/r/typescript/comments/co03ud/fully_typesafe_form_libraries/ewg09p0/)
- [Formik issue: Strongly Typed Fields](https://github.com/formium/formik/issues/1334)
- [react-hook-form extension: strictly-typed](https://github.com/react-hook-form/strictly-typed)

There are some existing truly type-safe react form solutions, but each has a
costly dependency associated with it:

- [formstate](https://github.com/formstate/formstate) --> `MobX`
- [Typescript.fun](https://dev.to/steida/how-to-forms-with-react-and-typescript-4icb)
  --> `fp-ts`
- [ReForm](https://github.com/Astrocoders/reform) --> `ReasonML`

#### b) Performance

There are SOME form libraries with really good performance (react-hook-form).
However combining convenient Context based hook API with React performance
optimizations is still problematic. See
https://react-hook-form.com/advanced-usage#FormProviderPerformance for example.

#### c) Declarative validation API

Usually form libs "outsource" advanced validation to schema-based libraries such
as `Yup`. This seems like a great idea but has some limitations:

- `yup` and similar packages are not designed with type-safety in mind
- Advanced optimizations (such as validating only the affected fields rather
  than the entire form) are not available.

### Limitations

- Form values type is limited by schema definition API and can't represent more
  advanced TS types
- Adding `required` validator does not impact type of values.
- number() fields are typed as `number | ""`, this is because HTML number inputs
  work with `""` as empty value.
- Definition of form shape and validation split into 2 separate steps
- Binding to input components is more verbose than with other form libraries
  (this is intentional to keep API type-safe and view-layer agnostic)
