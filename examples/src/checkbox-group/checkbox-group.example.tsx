import { createForm, useFormts } from "@virtuslab/formts";
import React from "react";

import "../basic.css";

const entries = <T extends object>(o: T): [keyof T, T[keyof T]][] =>
  Object.entries(o) as any;

const Schema = createForm.schema(fields => ({
  colors: fields.object({
    red: fields.bool(),
    green: fields.bool(),
    blue: fields.bool(),
  }),
}));

const COLOR_LABELS = {
  red: "Red",
  green: "Green",
  blue: "Blue",
};

const App: React.FC = () => {
  const [fields, form] = useFormts({ Schema });

  return (
    <form>
      <fieldset>
        <legend>Choose your favourite colors:</legend>

        {entries(fields.colors.children).map(([key, field]) => (
          <div key={field.id}>
            <input
              id={field.id}
              type="checkbox"
              name={fields.colors.id}
              checked={field.value}
              onBlur={field.handleBlur}
              onChange={e => field.setValue(e.target.checked)}
            />
            <label htmlFor={field.id}>{COLOR_LABELS[key]}</label>
          </div>
        ))}
      </fieldset>

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
