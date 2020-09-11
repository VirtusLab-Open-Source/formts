/**
 *
 * Simple example with basic form validation
 *
 */
import React from "react";

import { createForm, useFormts } from "formts";

const required = () => (val: unknown) =>
  val != null && val !== "" ? null : "Field required!";

const Schema = createForm.schema(
  fields => ({
    userName: fields.string(),
    email: fields.string(),
  }),
  errors => errors<string>()
);

const validator = createForm.validator(Schema, validate => [
  validate({
    field: Schema.userName,
    rules: () => [required()],
  }),
  validate({
    field: Schema.email,
    rules: () => [
      required(),
      email => (/someregex/.test(email) ? null : "Invalid email address!"),
    ],
  }),
]);

export const MyForm: React.FC = () => {
  const [fields, form] = useFormts({ Schema, validator });
  const onSubmit = form.getSubmitHandler(values => console.log(values));

  return (
    <form onSubmit={onSubmit}>
      <input
        value={fields.email.value}
        onChange={fields.email.handleChange}
        onBlur={fields.email.handleBlur}
      />
      {fields.email.error}

      <input
        value={fields.userName.value}
        onChange={fields.userName.handleChange}
        onBlur={fields.userName.handleBlur}
      />
      {fields.email.error}

      <button type="submit">Submit</button>
    </form>
  );
};
