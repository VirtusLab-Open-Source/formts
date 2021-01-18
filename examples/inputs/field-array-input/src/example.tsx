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
  promoCodes: fields.array(fields.string()),
}));

const Example: React.FC = () => {
  const controller = useFormController({
    Schema,
    initialValues: { promoCodes: [""] },
  });

  return (
    <FormProvider controller={controller}>
      <PromoCodesArrayInput />
      <Debug />
    </FormProvider>
  );
};

const PromoCodesArrayInput: React.FC = () => {
  const arrayField = useField(Schema.promoCodes);

  return (
    <fieldset>
      <legend>Enter your promo codes!</legend>

      {arrayField.children.map((field, i) => (
        <section>
          <input
            key={field.id}
            value={field.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            autoComplete="off"
          />
          <button
            onClick={() => arrayField.removeItem(i)}
            disabled={arrayField.value.length === 1}
          >
            Remove
          </button>
        </section>
      ))}

      <button onClick={() => arrayField.addItem("")}>Add</button>
    </fieldset>
  );
};

const Debug: React.FC = () => {
  const form = useFormHandle(Schema);
  const values = useFormValues(Schema);

  const promoCodes = useField(Schema.promoCodes);

  const info = {
    values,
    form,
    fields: { promoCodes },
  };

  return (
    <pre>
      <h3>Debug</h3>
      {JSON.stringify(info, null, 2)}
    </pre>
  );
};

ReactDOM.render(<Example />, document.getElementById("root"));
