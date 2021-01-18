/* eslint-disable @typescript-eslint/no-use-before-define */

import {
  Box,
  FormControl,
  InputLabel,
  Input,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@material-ui/core";
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

const COLOR_VALUES = ["red", "green", "blue"] as const;

const COLOR_LABELS = {
  red: "Red",
  green: "Green",
  blue: "Blue",
};

const Schema = createFormSchema(fields => ({
  colors: fields.array(fields.choice(...COLOR_VALUES)),
}));

const Example: React.FC = () => {
  const controller = useFormController({ Schema });

  return (
    <FormProvider controller={controller}>
      <ColorsMultiSelectInput />
      <Debug />
    </FormProvider>
  );
};

const ColorsMultiSelectInput: React.FC = () => {
  const colors = useField(Schema.colors);

  return (
    <Box width={300}>
      <FormControl fullWidth>
        <InputLabel id={colors.id}>Choose your favourite colors:</InputLabel>
        <Select
          labelId={colors.id}
          value={colors.value}
          onChange={colors.handleChange}
          input={<Input />}
          renderValue={selected => (selected as string[]).join(", ")}
          multiple
        >
          {COLOR_VALUES.map(color => (
            <MenuItem key={color} value={color}>
              <Checkbox checked={colors.value.includes(color)} />
              <ListItemText primary={COLOR_LABELS[color]} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
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
