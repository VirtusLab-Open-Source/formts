/* eslint-disable @typescript-eslint/no-use-before-define */

import { Button, TextField, Box } from "@material-ui/core";
import {
  createFormSchema,
  createFormValidator,
  useFormController,
  useFormHandle,
  useField,
  useFormValues,
  FormProvider,
} from "@virtuslab/formts";
import { withError, required, minValue } from "@virtuslab/formts/validators";
import React from "react";
import ReactDOM from "react-dom";

import "../index.css";

const Schema = createFormSchema(
  fields => ({
    name: fields.string(),
    age: fields.number(),
  }),
  errors => errors<string>()
);

const validator = createFormValidator(Schema, validate => [
  validate(
    Schema.name,
    // you can mix built-in validators with custom functions
    withError(required(), "Required"),
    val => (val.length > 10 ? "Name must be max 10 characters long" : null)
  ),
  validate(
    Schema.age,
    withError(required(), "Required"),
    withError(minValue(18), "Age must be at least 18")
  ),
]);

const Example: React.FC = () => {
  const controller = useFormController({ Schema, validator });

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
    <Box component="section" margin={2}>
      <TextField
        type="text"
        label="Name:"
        id={field.id}
        value={field.value}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
        error={field.error != null}
        helperText={field.error}
        autoComplete="off"
      />
    </Box>
  );
};

const AgeField: React.FC = () => {
  const field = useField(Schema.age);

  return (
    <Box component="section" margin={2}>
      <TextField
        type="number"
        label="Age:"
        id={field.id}
        value={field.value}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
        error={field.error != null}
        helperText={field.error}
        autoComplete="off"
      />
    </Box>
  );
};

const FormActions: React.FC = () => {
  const form = useFormHandle(Schema);

  return (
    <Box component="section" margin={3}>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={form.isValid === false}
        onClick={() =>
          form.submit(values => alert(JSON.stringify(values, null, 2)))
        }
      >
        Submit
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        type="reset"
        onClick={form.reset}
      >
        Reset
      </Button>
    </Box>
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
