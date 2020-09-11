import React from "react";

import {
  useForm,
  fields,
  validators,
  transformers,
  FieldDescriptor,
} from "formts.b";

export const MyForm = props => {
  const form = useForm(
    {
      title: fields.choice("Mr", "Mrs", "Miss").validate(validators.required()),

      name: fields.string().initial("Foo").validate(validators.required()),

      age: fields
        .number()
        .validate(validators.required(), validators.minValue(18))
        .transform(
          transformers.integer(),
          transformers.map(age => age + 1)
        ),

      coupons: fields.array(
        fields
          .string()
          .validate(
            validators.when(
              () => [form.fields.address.country],
              country =>
                country === "PL" &&
                validators.pattern(/foobar/, "invalidFormat")
            )
          )
          .transform(transformers.upperCase())
      ),

      address: fields
        .object({
          country: fields.string(),
          street: fields.string(),
          zipCode: fields.string().transform(transformers.maxLength(6)),
        })
        .validate(
          validators.test(
            "remoteValidation",
            async (address, name) => {
              try {
                await props.validateAddress(address, name);
                return { ok: true };
              } catch (err) {
                return { ok: false };
              }
            },
            () => [form.fields.name]
          )
        ),

      notes: fields.string(),
    },
    [props.validateAddress]
  );

  return (
    <form onSubmit={form.handleSubmit(props.submitForm)}>
      {/* ... */}

      <AgeField ageField={form.fields.age} />

      {/* ... */}

      <button type="submit">Submit!</button>
    </form>
  );
};

export const AgeField: React.FC<{
  ageField: FieldDescriptor<number>;
}> = ({ ageField }) => {
  const errorMessage = ageField.reduceError({
    required: () => <span>Field Required!</span>,
    minValue: ({ min }) => <span>Minimum age is {min} years!</span>,
  });

  return (
    <div>
      <label htmlFor="ageField">Age:</label>
      <input
        id="ageField"
        value={ageField.value}
        onChange={e => ageField.parseEvent(e).then(ageField.setValue)}
        onBlur={ageField.handleBlur}
      />
      {errorMessage}
    </div>
  );
};
