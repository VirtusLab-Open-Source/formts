import { createForm, useFormts } from "@virtuslab/formts";
import React from "react";

import "../basic.css";

const Schema = createForm.schema(
  fields => ({
    name: fields.string(),
    age: fields.number(),
  }),
  error => error<string>()
);

const validator = createForm.validator(Schema, validate => [
  validate({
    field: Schema.name,
    rules: () => [val => (val === "" ? "Required!" : null)],
  }),
  validate({
    field: Schema.age,
    rules: () => [
      val => (val === "" ? "Required!" : null),
      val => (val < 18 ? "Age must be at least 18." : null),
    ],
  }),
]);

const App: React.FC = () => {
  const [fields, form] = useFormts({ Schema, validator });

  const onSubmit = form.getSubmitHandler(values =>
    alert("submitted!\n" + JSON.stringify(values, null, 2))
  );

  return (
    <form onSubmit={onSubmit}>
      <section>
        <label htmlFor={fields.name.id}>Name:</label>
        <input
          id={fields.name.id}
          value={fields.name.value}
          onChange={e => fields.name.setValue(e.target.value)}
          onBlur={fields.name.handleBlur}
        />
        <div className="error">{fields.name.error}</div>
      </section>

      <section>
        <label htmlFor={fields.age.id}>Age:</label>
        <input
          type="number"
          id={fields.age.id}
          value={fields.age.value}
          onChange={e =>
            fields.age.setValue(e.target.value === "" ? "" : +e.target.value)
          }
          onBlur={fields.age.handleBlur}
        />
        <div className="error">{fields.age.error}</div>
      </section>

      <section>
        <button type="submit" disabled={!form.isValid}>
          Submit!
        </button>
      </section>

      <pre>
        <h3>Form:</h3>
        {JSON.stringify(form, null, 2)}
      </pre>

      <pre>
        <h3>Fields:</h3>
        {JSON.stringify(fields, null, 2)}
      </pre>
    </form>
  );
};

export default App;
