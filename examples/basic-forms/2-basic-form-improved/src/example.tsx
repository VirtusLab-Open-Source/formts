/* eslint-disable @typescript-eslint/no-use-before-define */

import {
  createFormSchema,
  useFormController,
  useFormHandle,
  useField,
  useFormValues,
  FormProvider,
} from "@virtuslab/formts";
import React from "react";
import ReactDOM from "react-dom";

import "../index.css";

const Schema = createFormSchema(fields => ({
  name: fields.string(),
  age: fields.number(),
}));

const Example: React.FC = () => {
  const controller = useFormController({ Schema });

  return (
    <FormProvider controller={controller}>
      <form onSubmit={e => e.preventDefault()}>
        <NameField />
        <AgeField />
        <FormActions />
        <Debug />
      </form>
    </FormProvider>
  );
};

const NameField: React.FC = () => {
  const field = useField(Schema.name);

  return (
    <section>
      <label htmlFor={field.id}>Name:</label>
      <input
        id={field.id}
        value={field.value}
        onChange={e => field.setValue(e.target.value)}
        onBlur={field.handleBlur}
        autoComplete="off"
      />
    </section>
  );
};

const AgeField: React.FC = () => {
  const field = useField(Schema.age);

  return (
    <section>
      <label htmlFor={field.id}>Age:</label>
      <input
        type="number"
        id={field.id}
        value={field.value}
        onChange={e =>
          field.setValue(e.target.value === "" ? "" : +e.target.value)
        }
        onBlur={field.handleBlur}
        autoComplete="off"
      />
    </section>
  );
};

const FormActions: React.FC = () => {
  const form = useFormHandle(Schema);

  return (
    <section>
      <button
        type="submit"
        onClick={() =>
          form.submit(values => alert(JSON.stringify(values, null, 2)))
        }
      >
        Submit!
      </button>

      <button type="reset" onClick={form.reset}>
        Reset
      </button>
    </section>
  );
};

const Debug: React.FC = () => {
  const form = useFormHandle(Schema);
  const values = useFormValues(Schema);

  const name = useField(Schema.name);
  const age = useField(Schema.age);

  const info = {
    values,
    form,
    fields: { name, age },
  };

  return (
    <pre>
      <h3>Debug</h3>
      {JSON.stringify(info, null, 2)}
    </pre>
  );
};

ReactDOM.render(<Example />, document.getElementById("root"));
