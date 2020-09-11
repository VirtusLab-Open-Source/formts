import React from "react";

import {
  buildForm,
  Fields,
  Validators,
  Transformers,
  useField,
} from "formts.c";

type FormCtx = {
  validateAddress: (address: any, name: any) => Promise<void>;
};

/**
 * builder creates:
 *  `Component` - React component responsible for keeping form state adn providing context for hooks
 *  `fields` - field pointers used in hooks and for specifying field dependencies
 *
 * Context (here `FormCtx`) is used to inject props into validation functions.
 * Each validator has unique key, which should be used to bind validation results to actual error messages later in the UI
 * User can choose when each transformer/validator are run.
 *
 */
const Form = buildForm<FormCtx>().withFields({
  title: Fields.choice("Mr", "Mrs", "Miss").validate(Validators.required()),

  name: Fields.string().validate(Validators.required()),

  age: Fields.number()
    .transform([Transformers.integer(), Transformers.map(age => age + 1)])
    .validate(Validators.required())
    .validate(
      (_ctx, country) => Validators.minValue(country === "US" ? 21 : 18),
      { deps: () => [Form.fields.address.country] }
    ),

  coupons: Fields.array(
    Fields.string()
      .transform(Transformers.upperCase())
      .transform(Transformers.trim(), { runOn: ["blur"] })
      .validate(Validators.pattern(/foobar/, "invalidFormat"), {
        deps: () => [Form.fields.address.country],
        condition: (_ctx, country) => country === "PL",
      })
  ),

  address: Fields.object({
    country: Fields.string(),
    street: Fields.string(),
    zipCode: Fields.string().transform(Transformers.maxLength(6)),
  }).validate(
    (ctx, name) =>
      Validators.of("remoteValidation", async address => {
        try {
          await ctx.validateAddress(address, name);
          return { ok: true };
        } catch (err) {
          return { ok: false };
        }
      }),
    { deps: () => [Form.fields.name], runOn: ["blur"] }
  ),

  notes: Fields.string(),
});

export const MyForm: React.FC<any> = props => {
  return (
    <Form.Component
      context={{
        validateAddress: props.validateAddress,
      }}
      initialValues={{
        name: "Foo",
      }}
      onSubmit={props.submitForm}
    >
      {/* ... */}

      <AgeField />

      {/* ... */}

      <button type="submit">Submit!</button>
    </Form.Component>
  );
};

export const AgeField: React.FC = () => {
  const field = useField(Form.fields.age);
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
        onChange={e => field.parseEvent(e).onOk(field.setValue)}
        onBlur={field.handleBlur}
      />
      {errorMessage}
    </div>
  );
};
