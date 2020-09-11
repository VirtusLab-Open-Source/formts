# Building forms in React and Typescript

## Popular existing solutions

- [Formik](https://jaredpalmer.com/formik) (22.2K ★) 👑
- [React Hook Form](https://react-hook-form.com/) (11K ★) 🔥
- [Redux Form](https://redux-form.com/8.3.0/) (12K ★) 💩
- [React Final Form](https://final-form.org/react) (6K ★)

## What's the problem?

codesandbox:

- [formik]()
- [formik + yup]()
- [react-hook-form]()

other sources:

- [reddit question](https://www.reddit.com/r/typescript/comments/co03ud/fully_typesafe_form_libraries/ewg09p0/)
- [formik issue](https://github.com/jaredpalmer/formik/issues/1334)

## Existing solutions focusing on type-safety

- [formstate](https://github.com/formstate/formstate)
- [typescript.fun/useForm + io-ts](https://dev.to/steida/how-to-forms-with-react-and-typescript-4icb)
- [reform](https://github.com/Astrocoders/reform)

# FormTs

### Why another lib?

### Goals:

- fully type-safe
- declarative API
- high performance
- minimal size
- separation of form logic from form presentation
- minimal API surface

### API Proposals

- A
- B
- C

### Roadmap

1. ~~**Research**~~
   What are other solutions and their problems?

2. **API design**
   What should be the features and public API of the lib?

3. **API PoC**
   Implement the form builder and typing behind public API to prove it works.

4. **Alpha version**  
   First working version (perhaps using Formik under the hood)

5. **Beta version**  
   Full implementation

6. **1.0**  
   Polishing, testing, documentation, benchmarks...
