import {
  createFormSchema,
  useFormController,
  useFormHandle,
  useField,
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
  const form = useFormHandle(Schema, controller);
  const name = useField(Schema.name, controller);
  const age = useField(Schema.age, controller);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        form.submit(values => alert(JSON.stringify(values, null, 2)));
      }}
      onReset={form.reset}
    >
      <section>
        <label htmlFor={name.id}>Name:</label>
        <input
          id={name.id}
          value={name.value}
          onChange={name.handleChange}
          onBlur={name.handleBlur}
          autoComplete="off"
        />
      </section>

      <section>
        <label htmlFor={age.id}>Age:</label>
        <input
          type="number"
          id={age.id}
          value={age.value}
          onChange={age.handleChange}
          onBlur={age.handleBlur}
          autoComplete="off"
        />
      </section>

      <section>
        <button type="submit">Submit!</button>
        <button type="reset">Reset</button>
      </section>

      <section>
        <pre>
          <h3>Debug</h3>
          {JSON.stringify({ form, fields: { name, age } }, null, 2)}
        </pre>
      </section>
    </form>
  );
};

ReactDOM.render(<Example />, document.getElementById("root"));
