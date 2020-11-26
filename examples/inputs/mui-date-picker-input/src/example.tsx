/* eslint-disable @typescript-eslint/no-use-before-define */

import DateUtils from "@date-io/date-fns";
import { Box } from "@material-ui/core";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
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
  date: fields.instanceOf(Date),
}));

const Example: React.FC = () => {
  const controller = useFormController({
    Schema,
  });

  return (
    <MuiPickersUtilsProvider utils={DateUtils}>
      <FormProvider controller={controller}>
        <DatePickerInput />
        <Debug />
      </FormProvider>
    </MuiPickersUtilsProvider>
  );
};

const DatePickerInput: React.FC = () => {
  const dateField = useField(Schema.date);

  return (
    <Box width={300}>
      <DatePicker
        variant="inline"
        label="Choose your favourite date"
        value={dateField.value}
        onChange={date => dateField.setValue(date as Date)}
        fullWidth
        autoOk
      />
    </Box>
  );
};

const Debug: React.FC = () => {
  const form = useFormHandle(Schema);
  const values = useFormValues(Schema);

  const date = useField(Schema.date);

  const info = {
    values,
    form,
    fields: { date },
  };

  return (
    <pre>
      <h3>Debug</h3>
      {JSON.stringify(info, null, 2)}
    </pre>
  );
};

ReactDOM.render(<Example />, document.getElementById("root"));
