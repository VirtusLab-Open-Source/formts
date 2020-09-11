/**
 *
 * Simplest possible example
 *
 */

import React from "react";

import { createForm, useFormts } from "formts";

const Schema = createForm.schema(fields => ({
  name: fields.string(),
  age: fields.number(),
}));

export const MyForm: React.FC = () => {
  const [fields, form] = useFormts({ Schema });
  const onSubmit = form.getSubmitHandler(values => console.log(values));

  return (
    <form onSubmit={onSubmit}>
      <input
        value={fields.name.value}
        onChange={fields.name.handleChange}
        onBlur={fields.name.handleBlur}
      />

      <input
        value={fields.age.value}
        onChange={fields.age.handleChange}
        onBlur={fields.age.handleBlur}
      />

      <button type="submit">Submit</button>
    </form>
  );
};
