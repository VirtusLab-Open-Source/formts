import React from "react";
import {
  define,
  fields,
  validators,
  transformers,
  Formts,
  useField,
} from "formts.a";

const Form = define.form({
  title: fields.choice("Mr", "Mrs", "Miss"),
  name: fields.string(),
  age: fields.number(),
  coupons: fields.array(fields.string()),
  address: fields.object({
    country: fields.string(),
    street: fields.string(),
    zipCode: fields.string(),
  }),
  notes: fields.string(),
});

const validator = (validateAddress: any) =>
  define.validator(Form, {
    title: [validators.required()],
    name: [validators.required()],
    age: [validators.required(), validators.minValue(18)],
    coupons: {
      each: [
        validators.when(
          [Form.address.country],
          country =>
            country === "PL" && validators.pattern(/foobar/, "invalidFormat")
        ),
      ],
    },
    address: {
      root: [
        validators.test(
          "remoteValidation",
          async (address, name) => {
            try {
              await validateAddress(address, name);
              return { ok: true };
            } catch (err) {
              return { ok: false };
            }
          },
          Form.name
        ),
      ],
    },
  });

const transformer = define.transformer(Form, {
  age: [transformers.integer(), transformers.map(age => age + 1)],
  coupons: {
    each: [transformers.upperCase()],
  },
  address: {
    zipCode: [transformers.maxLength(6)],
  },
});

export const MyForm = props => {
  return (
    <Formts
      schema={Form}
      initialValues={{
        // can be partial type
        name: "Foo",
      }}
      validator={validator(props.validateAddress)}
      transformer={transformer}
      onSubmit={props.submitForm}
    >
      {({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          {/* ... */}

          <AgeField />

          {/* ... */}

          <button type="submit">Submit!</button>
        </form>
      )}
    </Formts>
  );
};

export const AgeField = () => {
  const field = useField(Form.age);
  const errorMessage = field.reduceError({
    required: () => <span>Field Required!</span>,
    minValue: ({ min }) => <span>Minimum age is {min} years!</span>,
  });

  return (
    <div>
      <label htmlFor="ageField">Age:</label>
      <input
        id="ageField"
        value={field.value}
        onChange={e => field.parseEvent(e).then(field.setValue)}
        onBlur={field.handleBlur}
      />
      {errorMessage}
    </div>
  );
};
