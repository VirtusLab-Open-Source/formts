import { createForm, useFormts } from "@virtuslab/formts";
import React from "react";

import "../basic.css";

const Schema = createForm.schema(fields => ({
  color: fields.choice("Red", "Green", "Blue"),
}));

const App: React.FC = () => {
  const [fields, form] = useFormts({ Schema });

  return (
    <form>
      <label htmlFor={fields.color.id}>Choose your favourite color:</label>
      <select
        id={fields.color.id}
        value={fields.color.value}
        onChange={e => fields.color.setValue(e.target.value as any)}
        onBlur={fields.color.handleBlur}
      >
        {Object.keys(fields.color.options).map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

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
