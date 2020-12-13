[![build status](https://circleci.com/gh/VirtusLab/formts.svg?style=shield)](https://app.circleci.com/pipelines/github/VirtusLab/formts)
[![GitHub license](https://img.shields.io/github/license/VirtusLab/formts)](https://github.com/VirtusLab/formts/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/@virtuslab/formts)](https://www.npmjs.com/package/@virtuslab/formts)
[![examples](https://img.shields.io/badge/examples-codesandbox-blue)](https://github.com/VirtusLab/formts/tree/master/examples)

# Formts

**Type-safe, declarative and performant React form & validation library**

### Features

- Fully type-safe API, purpose built to get the most out of Typescript
  type-inference
- Declarative definition of form shape and validation rules
- Runtime type-checking of form values against the schema
- **[TODO]** Convenient hooks & context based API allowing for isolated
  re-renders
- Plain react-typescript, 0 dependencies
- View layer agnostic - no components are provided, works with any 3rd-party
  components
- Advanced validation API which enables:
  - **[TODO]** specifying dependencies on other fields
  - specifying validation triggers for individual rules
  - selective validation of just the affected fields on value changes
  - separation of error messages from error codes (optional)
  - easy mixing of built-in rules with custom functions
- **[TODO]** Transformation API for declarative mapping and filtering of field
  values
- Good scalability for very large and complex forms

### Getting Started

#### 1) Install

```bash
npm install @virtuslab/formts
```

#### 2) Define shape of the form

```ts
import { createFormSchema } from "@virtuslab/formts";

const Schema = createFormSchema(
  fields => ({ answer: fields.string() }),
  errors => errors<string>()
);
```

#### 3) Define validation rules (optional)

```ts
import { createFormValidator } from "@virtuslab/formts";

const validator = createFormValidator(Schema, validate => [
  validate(
    Schema.answer,
    val => (val === "" ? "Required!" : null),
    val => (val !== "42" ? "Wrong answer!" : null)
  ),
]);
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
        onChange={e => field.setValue(e.target.value)}
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

Currently API documentation is available only in form of JSDocs.
[Explore CodeSandbox examples](https://github.com/VirtusLab/formts/tree/master/examples)
to learn more.

### Why another form lib?

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

### Current limitations

- Form values type is limited by schema definition API and can't represent more
  advanced TS types
- Adding `required` validator does not impact type of values on Submit
- Definition of form shape and validation split into 2 separate steps
- Binding to input components is more verbose than with other form libraries
  (this is intentional to keep API type-safe and view-layer agnostic)
- Transformation API is limited to mapping inside the same type, i.e. `T => T`
