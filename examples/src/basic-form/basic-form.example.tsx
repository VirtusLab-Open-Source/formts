import { createForm, useFormts } from "@virtuslab/formts";
import React from "react";

import "../basic.css";

const Schema = createForm.schema(fields => ({
  name: fields.string(),
  age: fields.number(),
}));

const App: React.FC = () => {
  const [fields, form] = useFormts({ Schema });

  return (
    <form>
      <section>
        <label htmlFor={fields.name.id}>Name:</label>
        <input
          id={fields.name.id}
          value={fields.name.value}
          onChange={e => fields.name.setValue(e.target.value)}
          onBlur={fields.name.handleBlur}
        />
      </section>

      <section>
        <label htmlFor={fields.age.id}>Age:</label>
        <input
          id={fields.age.id}
          value={fields.age.value}
          onChange={e =>
            fields.age.setValue(e.target.value === "" ? "" : +e.target.value)
          }
          onBlur={fields.age.handleBlur}
        />
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
