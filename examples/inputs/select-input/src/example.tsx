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

const Schema = createFormSchema(fields => ({
  color: fields.choice("red", "green", "blue"),
}));

const Example: React.FC = () => {
  const controller = useFormController({ Schema });

  return (
    <FormProvider controller={controller}>
      <ColorSelectInput />
      <Debug />
    </FormProvider>
  );
};

const ColorSelectInput: React.FC = () => {
  const field = useField(Schema.color);

  const labels = {
    red: "Red",
    green: "Green",
    blue: "Blue",
  };
  type Color = keyof typeof field.options;

  return (
    <>
      <label htmlFor={field.id}>Choose your favourite color:</label>
      <select
        id={field.id}
        value={field.value}
        onChange={e => field.setValue(e.target.value as Color)}
        onBlur={field.handleBlur}
      >
        {/* 
         we need custom-typed Object.keys in order for type of `option`
         to be inferred properly to "red" | "green" | "blue" in this example 
        */}
        {Object.values(field.options).map(option => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </>
  );
};

const Debug: React.FC = () => {
  const form = useFormHandle(Schema);
  const values = useFormValues(Schema);

  const color = useField(Schema.color);

  const info = {
    values,
    form,
    fields: { color },
  };

  return (
    <pre>
      <h3>Debug</h3>
      {JSON.stringify(info, null, 2)}
    </pre>
  );
};

ReactDOM.render(<Example />, document.getElementById("root"));
