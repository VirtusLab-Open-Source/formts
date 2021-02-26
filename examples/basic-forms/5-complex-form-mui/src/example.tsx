/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core";
import {
  createFormSchema,
  createFormValidator,
  useFormController,
  useFormHandle,
  useField,
  useFormValues,
  FormProvider,
  validators,
} from "@virtuslab/formts";
import React from "react";
import ReactDOM from "react-dom";

import "../index.css";

const ingredients = [
  "Mozzarella",
  "Pepperoni",
  "Bell Pepper",
  "Oscypek",
  "Grilled Bacon",
  "Jalapeno",
  "Smoked Paprika",
] as const;

type Ingredient = typeof ingredients[number];

const Schema = createFormSchema(
  fields => ({
    name: fields.string(),
    phoneNumber: fields.number(),
    deliveryDate: fields.date(),
    array: fields.array(
      fields.object({
        style: fields.choice("Italian", "American"),
        glutenFree: fields.bool(),
        ingredients: fields.array(fields.choice(...ingredients)),
      })
    ),
    dependentFields: fields.object({
      pickup: fields.choice("Pickup", "Home Delivery"),
      payment: fields.choice("Cash", "Online"),
    }),
  }),
  errors => errors<string>()
);

const validator = createFormValidator(Schema, validate => [
  validate(
    Schema.name,
    // you can mix built-in validators with custom functions
    validators.withError(validators.required(), "Required"),
    val => (val.length > 10 ? "Name must be max 10 characters long" : null)
  ),
  validate({
    field: Schema.phoneNumber,
    debounce: 500,
    rules: () => [phoneLengthValidation],
  }),
  validate({
    field: Schema.deliveryDate,
    triggers: ["change"],
    rules: () => [validateDeliveryTime],
  }),
  validate({
    field: Schema.array,
    rules: () => [
      array =>
        array.length < 1
          ? "Order cannot be empty"
          : array.length > 3
          ? "Can order up to 3 pizzas"
          : null,
    ],
  }),
  validate({
    field: Schema.dependentFields.payment,
    dependencies: [Schema.dependentFields.pickup],
    rules: pickup => [
      payment =>
        pickup === "Home Delivery" && payment === "Cash"
          ? "Home Delivery only allows online payment"
          : null,
    ],
  }),
  validate({
    field: Schema.array.nth,
    rules: () => [
      x => (x.ingredients.length < 2 ? "Select at least 2 ingredients" : null),
      x =>
        x.glutenFree && x.ingredients.includes("Grilled Bacon")
          ? "Gluten-free cannot include Grilled Bacon"
          : null,
    ],
  }),
]);

const validateDeliveryTime = (date: Date | null): Promise<string | null> => {
  return new Promise(resolve => {
    console.log("Running async validation...");
    setTimeout(() => {
      console.log("Async validation finished.");
      if (date && date.getHours() > 12) {
        resolve(null);
      } else {
        resolve("Too busy! Select later hours.");
      }
    }, 2000);
  });
};

const phoneLengthValidation = (x: number | "") => {
  console.log("Running debounced validation for phone number");
  return x.toString().length === 9 ? null : "Invalid phone number";
};

const Example: React.FC = () => {
  const controller = useFormController({
    Schema,
    validator,
    initialValues: {
      deliveryDate: new Date(),
      dependentFields: { payment: "Online", pickup: "Home Delivery" },
    },
  });

  return (
    <FormProvider controller={controller}>
      <Box display="flex" flexDirection="row" justifyContent="space-between">
        <form onSubmit={e => e.preventDefault()}>
          <Box display="flex" flexDirection="column" style={{ padding: "3vw" }}>
            <Typography variant="h2" color="primary">
              FormTS
            </Typography>
            <Typography variant="subtitle1" color="secondary">
              Type-safe, declarative and performant React form & validation
              library
            </Typography>
            <PrimitiveSection />
            <ArraySection />
            <DependentFieldsSection />
            <FormActions />
          </Box>
        </form>
        <Debug />
      </Box>
    </FormProvider>
  );
};

const PrimitiveSection: React.FC = () => {
  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" flexDirection="row">
        <NameField />
        <PhoneNumberField />
      </Box>
      <DeliveryDateField />
    </Box>
  );
};

const NameField: React.FC = () => {
  const field = useField(Schema.name);

  return (
    <Box display="flex" flexDirection="column" marginRight={2} marginBottom={2}>
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
      <RenderCounter name="name" />
    </Box>
  );
};

const PhoneNumberField: React.FC = () => {
  const field = useField(Schema.phoneNumber);

  return (
    <Box display="flex" flexDirection="column" marginLeft={2} marginBottom={2}>
      <TextField
        type="number"
        label="Phone number:"
        id={field.id}
        value={field.value}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
        error={field.error != null}
        helperText={field.error}
        autoComplete="off"
      />
      <RenderCounter name="phoneNumber" />
    </Box>
  );
};

const DeliveryDateField: React.FC = () => {
  const field = useField(Schema.deliveryDate);

  return (
    <>
      <TextField
        type="datetime-local"
        label="Delivery date:"
        id={field.id}
        value={field.value?.toISOString().slice(0, 16)}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
        error={field.error != null || field.isValidating}
        helperText={
          field.isValidating ? "Checking availability..." : field.error
        }
        autoComplete="off"
      />
      <RenderCounter name="deliveryDate" />
    </>
  );
};

const ArraySection: React.FC = () => {
  const array = useField(Schema.array);

  const handleAdd = () => {
    array.addItem({ style: "Italian", glutenFree: false, ingredients: [] });
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      marginTop={4}
    >
      <Box display="flex" flexDirection="row" justifyContent="space-between">
        <Typography variant="h6" color="primary" align="left">
          Order
        </Typography>
        <Button variant="contained" color="secondary" onClick={handleAdd}>
          + add next
        </Button>
      </Box>
      <RenderCounter name="array" />
      <Typography variant="caption" color="error" align="left">
        {array.error}
      </Typography>
      {array.value.map((x, i) => (
        <ArrayElementField key={i} index={i} removeItem={array.removeItem} />
      ))}
    </Box>
  );
};

const ArrayElementField: React.FC<{
  index: number;
  removeItem: (index: number) => void;
}> = ({ index, removeItem }) => {
  const field = useField(Schema.array.nth(index));
  const price =
    field.value.ingredients.length * 5 * (field.value.glutenFree ? 2 : 1);

  const handleIngredientChange = (i: Ingredient) => {
    const included = field.value.ingredients.includes(i);
    if (included) {
      field.setValue({
        ...field.value,
        ingredients: field.value.ingredients.filter(x => x !== i),
      });
    } else {
      field.setValue({
        ...field.value,
        ingredients: [...field.value.ingredients, i],
      });
    }
  };

  const handleGlutenFreeChange = (to: boolean) => {
    field.setValue({ ...field.value, glutenFree: to });
  };

  return (
    <Box display="flex" flexDirection="column" marginTop={4}>
      <Paper>
        <Box display="flex" flexDirection="column" padding={2}>
          <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
          >
            <Typography variant="subtitle1" color="secondary">
              Pizza #{index}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              type="reset"
              onClick={() => removeItem(index)}
            >
              Remove
            </Button>
          </Box>

          <Box
            display="flex"
            flexDirection="row"
            padding={1}
            justifyContent="space-between"
          >
            <TextField
              id="select"
              label="Style"
              value={field.value.style}
              onChange={field.children.style.handleChange}
              select
            >
              {Object.values(field.children.style.options).map(typeValue => (
                <MenuItem key={typeValue} value={typeValue}>
                  {typeValue}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value.glutenFree}
                  onChange={(_, to) => handleGlutenFreeChange(to)}
                  name="glutenFree"
                />
              }
              label="Gluten-free"
            />
          </Box>
          <Box display="flex" flexDirection="column" padding={2}>
            <Typography variant="subtitle2" color="primary">
              Select ingredients
            </Typography>
            <Typography variant="caption" color="error" align="left">
              {field.error}
            </Typography>
            {ingredients.map(i => {
              const checked = field.value.ingredients.includes(i);

              return (
                <FormControlLabel
                  key={i}
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={() => handleIngredientChange(i)}
                      name={i}
                    />
                  }
                  label={i}
                />
              );
            })}
            <Box
              display="flex"
              flexDirection="column"
              padding={1}
              alignSelf="flex-end"
            >
              <Typography variant="h6" color="primary">
                {price}$
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const DependentFieldsSection: React.FC = () => {
  const pickup = useField(Schema.dependentFields.pickup);
  const payment = useField(Schema.dependentFields.payment);

  return (
    <Box display="flex" flexDirection="column" marginY={2}>
      <TextField
        id="select"
        label="Pickup"
        value={pickup.value}
        error={pickup.error != null}
        helperText={pickup.error}
        select
        onChange={pickup.handleChange}
      >
        {Object.values(pickup.options).map(typeValue => (
          <MenuItem key={typeValue} value={typeValue}>
            {typeValue}
          </MenuItem>
        ))}
      </TextField>
      <RenderCounter name="pickup" />
      <TextField
        id="select"
        label="Payment"
        value={payment.value}
        error={payment.error != null}
        helperText={payment.error}
        select
        onChange={payment.handleChange}
      >
        {Object.values(payment.options).map(typeValue => (
          <MenuItem key={typeValue} value={typeValue}>
            {typeValue}
          </MenuItem>
        ))}
      </TextField>
      <RenderCounter name="payment" />
    </Box>
  );
};

const FormActions: React.FC = () => {
  const form = useFormHandle(Schema);

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        flexDirection="row"
        marginTop={5}
      >
        <Button
          variant="outlined"
          color="secondary"
          type="reset"
          onClick={form.reset}
        >
          Clear
        </Button>
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
      </Box>
      <RenderCounter name="formActions" />
    </>
  );
};

export const Debug: React.FC = () => {
  const form = useFormHandle(Schema);
  const values = useFormValues(Schema);

  return (
    <pre>
      <h3>Debug</h3>
      {JSON.stringify(form, null, 2)}
      {JSON.stringify(values, null, 2)}
    </pre>
  );
};

const RenderCounter: React.FC<{ name: string }> = ({ name }) => {
  const renderCounter = useRenderCounter(name);

  return (
    <Typography variant="caption" color="textSecondary" align="right">
      render #{renderCounter}
    </Typography>
  );
};

const useRenderCounter = (() => {
  let dict: Record<string, number> = {};
  return (key: string) => {
    if (!dict[key]) {
      dict[key] = 0;
    }
    dict[key] += 1;
    return dict[key];
  };
})();

ReactDOM.render(<Example />, document.getElementById("root"));
