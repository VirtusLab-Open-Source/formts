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
  colors: fields.choice("", "red", "green", "blue"),
}));

const Example: React.FC = () => {
  const controller = useFormController({ Schema });

  return (
    <FormProvider controller={controller}>
      <ColorsRadioGroup />
      <Debug />
    </FormProvider>
  );
};

const ColorsRadioGroup: React.FC = () => {
  const colors = useField(Schema.colors);

  const labels = {
    red: "Red",
    green: "Green",
    blue: "Blue",
  };

  return (
    <fieldset>
      <legend>Choose your favourite color:</legend>

      {Object.values(colors.options).map(option => (
        <div key={option}>
          <input
            id={option}
            type="radio"
            name={colors.id}
            checked={colors.value === option}
            onBlur={colors.handleBlur}
            onChange={e => e.target.checked && colors.setValue(option)}
          />
          <label htmlFor={option}>{labels[option]}</label>
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
