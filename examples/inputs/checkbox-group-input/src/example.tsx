/* eslint-disable @typescript-eslint/no-use-before-define */

import {
  createFormSchema,
  useFormController,
  useField,
  FormProvider,
  useFormHandle,
  useFormValues,
} from "@virtuslab/formts";
import React from "react";
import ReactDOM from "react-dom";

import "../index.css";

const entries = <T extends object>(o: T): [keyof T, T[keyof T]][] =>
  Object.entries(o) as any;

const Schema = createFormSchema(fields => ({
  colors: fields.object({
    red: fields.bool(),
    green: fields.bool(),
    blue: fields.bool(),
  }),
}));

const Example: React.FC = () => {
  const controller = useFormController({ Schema });

  return (
    <FormProvider controller={controller}>
      <ColorsCheckboxGroup />
      <Debug />
    </FormProvider>
  );
};

const ColorsCheckboxGroup: React.FC = () => {
  const colors = useField(Schema.colors);

  const labels = {
    red: "Red",
    green: "Green",
    blue: "Blue",
  };

  return (
    <fieldset>
      <legend>Choose your favourite colors:</legend>

      {/* 
        we need custom-typed Object.entries in order for type of `key`
        to be inferred properly to "red" | "green" | "blue" in this example 
      */}
      {entries(colors.children).map(([key, field]) => (
        <div key={field.id}>
          <input
            id={field.id}
            type="checkbox"
            name={colors.id}
            checked={field.value}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
          />
          <label htmlFor={field.id}>{labels[key]}</label>
        </div>
      ))}
    </fieldset>
  );
};

const Debug: React.FC = () => {
  const form = useFormHandle(Schema);
  const values = useFormValues(Schema);

  const colors = useField(Schema.colors);

  const info = {
    values,
    form,
    fields: { colors },
  };

  return (
    <pre>
      <h3>Debug</h3>
      {JSON.stringify(info, null, 2)}
    </pre>
  );
};

ReactDOM.render(<Example />, document.getElementById("root"));
