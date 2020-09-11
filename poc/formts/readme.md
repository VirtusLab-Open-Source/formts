# Formts

**Proof of concept and API proposal for Typescript-focused, schema-based React form library**

### Why another form lib?

#### a) Type-safety

Most popular form libraries like `Formik` and `react-hook-form` are written in Typescript but are not _designed_ with type-safe API as a primary concern.

There is some evidence that this is important for some people:

- [Reddit: Fully type-safe form libraries?](https://www.reddit.com/r/typescript/comments/co03ud/fully_typesafe_form_libraries/ewg09p0/)
- [Formik issue: Strongly Typed Fields](https://github.com/formium/formik/issues/1334)
- [react-hook-form extension: strictly-typed](https://github.com/react-hook-form/strictly-typed)

There are some existing truly type-safe react form solutions, but each has a costly dependency associated with it:

- [formstate](https://github.com/formstate/formstate) --> `MobX`
- [Typescript.fun](https://dev.to/steida/how-to-forms-with-react-and-typescript-4icb) --> `fp-ts`
- [ReForm](https://github.com/Astrocoders/reform) --> `ReasonML`

#### b) Performance

There are some form libraries with poor performance (looking at you Formik), and there are some libs with good performance (react-hook-form). But combining convenient Context based hook API with React performance optimizations is still problematic. See https://react-hook-form.com/advanced-usage#FormProviderPerformance for example.

#### c) Declarative validation API

Usually form libs "outsource" advanced validation to schema-based libraries such as `Yup`. This seems like a great idea but has some limitations:

- `yup` and similar packages are not designed with type-safety in mind
- Advanced optimizations (such as validating only the affected fields rather than the entire form) are not available.

### Formts - goals

- Fully type-safe API
- Runtime type-checking of form values against schema
- Declarative definition of form shape and validation rules
- Convenient context-based API without extra re-renders
- Plain react-typescript, no heavy dependencies
- Advanced validation API which enables:
  - specifying dependencies on other fields
  - specifying validation triggers for individual rules
  - selective validation of just the affected fields on value changes
  - separation of error messages from error codes (optional)
  - easy mixing of built-in rules with custom functions
- Transformation API for declarative mapping and filtering of field values
- View layer agnostic - no components are provided
- Good scalability for very large and complex forms

### Current limitations

- Form values type is limited by schema definition API and can't represent more advanced TS types
- Adding `required` validator does not impact type of values on Submit
- Definition of form shape and validation split into 2 separate steps
- Binding to input components is more verbose than with other form libraries (this is intentional to keep API type-safe and view-layer agnostic)
- Transformation API is limited to mapping inside the same type, i.e. `T => T`

### Project Status

This is a proposal of public interface of the lib with most of the typing already in place together with JSDocs.
Majority of the actual implementation logic is missing.
