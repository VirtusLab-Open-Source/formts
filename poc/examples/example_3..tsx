/**
 *
 * Example including:
 * - form validation using error codes and built-in validators
 * - usage of FormtsProvider and useField hook
 * - generic input component based on FieldDescriptor type
 *
 */
import React from "react";

import { createForm, useFormts, useField, FieldDescriptor } from "formts";
import {
  BaseErrors,
  required,
  minLength,
  optional,
  pattern,
  withError,
} from "formts/validators";

type FormError =
  | BaseErrors.Required
  | BaseErrors.MinLength
  | { code: "invalidEmail" };

const Schema = createForm.schema(
  fields => ({
    userName: fields.string(),
    email: fields.string(),
  }),
  errors => errors<FormError>()
);

const validator = createForm.validator(Schema, validate => [
  validate({
    field: Schema.userName,
    rules: () => [required(), minLength(4)],
  }),
  validate({
    field: Schema.email,
    rules: () => [
      optional(),
      withError(pattern(/someregex/), { code: "invalidEmail" }),
    ],
  }),
]);

const renderError = (error: FormError | null): string | null => {
  if (!error) return null;

  switch (error.code) {
    case "required":
      return "Required!";
    case "minLength":
      return `Min length is ${error.min} characters!`;
    case "invalidEmail":
      return "Invalid email address!";
  }
};

export const MyForm: React.FC = () => {
  const [, form, FormtsProvider] = useFormts({
    Schema,
    validator,
  });
  const onSubmit = form.getSubmitHandler(values => console.log(values));

  return (
    <FormtsProvider>
      <form onSubmit={onSubmit}>
        <TextInput
          for={Schema.email}
          renderError={renderError}
          label="Email:"
        />
        <TextInput
          for={Schema.userName}
          renderError={renderError}
          label="Name:"
        />
        <button type="submit">Submit</button>
      </form>
    </FormtsProvider>
  );
};

const TextInput = <Err extends object>(props: {
  for: FieldDescriptor<string, Err>;
  label: string;
  renderError: (err: Err | null) => React.ReactNode;
}) => {
  const field = useField(props.for);

  return (
    <>
      <label htmlFor={field.id}>{props.label}</label>
      <input
        id={field.id}
        value={field.value}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
      />
      {props.renderError(field.error)}
    </>
  );
};
