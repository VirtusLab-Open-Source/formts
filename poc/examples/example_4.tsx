/**
 *
 * Example with:
 * - various input types
 * - initial form values
 * - complex form shape and validation rules
 * - form transformation rules
 * - Date instance in form state
 * - React performance optimizations
 *
 * The form is split into simple components for each field
 *
 */

import React from "react";

import { createForm, useFormts, useField, ExtractFormValues } from "formts";
import { toUpperCase, round, mapValues } from "formts/transformers";
import {
  BaseErrors,
  required,
  optional,
  minLength,
  minValue,
  validDate,
  oneOf,
  withError,
  pattern,
} from "formts/validators";

namespace Form {
  export type Errors =
    | BaseErrors.Required
    | BaseErrors.MinLength
    | BaseErrors.MinValue
    | BaseErrors.InvalidDate
    | BaseErrors.NotOneOf
    | { code: "invalidAddress"; foo: string }
    | { code: "invalidCoupon" }
    | { code: "asyncValidationError"; error: Error };

  export type Values = ExtractFormValues<typeof Schema>;

  export const Schema = createForm.schema(
    fields => ({
      title: fields.choice("", "Mr", "Mrs", "Miss"),
      name: fields.string(),
      age: fields.number(),
      dateOfPurchase: fields.instanceOf(Date),
      coupons: fields.array(fields.string()),
      address: fields.object({
        country: fields.string(),
        street: fields.string(),
        zipCode: fields.string(),
      }),
      notes: fields.string(),
    }),
    errors => errors<Form.Errors>()
  );

  export const getValidator = (
    ctx: Pick<MyFormProps, "getMinAge" | "validateCoupon">
  ) =>
    createForm.validator(Schema, validate => [
      validate({
        field: Schema.title,
        rules: () => [oneOf("Mrs", "Miss")],
      }),
      validate({
        field: Schema.name,
        rules: () => [required()],
      }),
      validate({
        field: Schema.address.root,
        rules: () => [
          ({ country, street, zipCode }) => ({
            code: "invalidAddress",
            foo: "bar",
          }),
        ],
      }),
      validate({
        field: Schema.address.street,
        rules: () => [minLength(10)],
      }),
      validate({
        field: Schema.age,
        dependencies: [Schema.address.country],
        rules: country => [minValue(ctx.getMinAge(country))],
      }),
      validate({
        field: Schema.dateOfPurchase,
        dependencies: [Schema.age],
        rules: age => [age < 18 && required(), validDate()],
      }),
      validate.each({
        field: Schema.coupons.root,
        triggers: ["blur"],
        rules: () => [
          withError(pattern(/somecouponregex/), { code: "invalidCoupon" }),
          async coupon => {
            try {
              const valid = await ctx.validateCoupon(coupon);
              return valid ? null : { code: "invalidCoupon" };
            } catch (error) {
              return { code: "asyncValidationError", error };
            }
          },
        ],
      }),
      validate({
        field: Schema.notes,
        triggers: ["change", "blur", "submit"],
        rules: () => [optional(), minLength(10)],
      }),
    ]);

  export const transformer = createForm.transformer(Schema, transform => [
    transform({
      field: Schema.age,
      rules: [mapValues(age => (age === "" ? "" : age / 2)), round("ceil")],
      triggers: ["blur"],
    }),
    transform.each({
      field: Schema.coupons.root,
      rules: [toUpperCase()],
      triggers: ["change"],
    }),
  ]);

  export const renderError = (error: Form.Errors | null): string | null => {
    if (!error) return null;

    switch (error.code) {
      case "required":
        return "Field is required!";
      case "notOneOf":
        return `Value must be one of ${error.allowedValues.join(", ")}`;
      case "minValue":
        return `Minimum value is ${error.min}`;
      case "minLength":
        return `Minimum length is ${error.min}`;
      case "invalidAddress":
        return `Address is not valid because ${error.foo}`;
      case "invalidCoupon":
        return "You entered invalid coupon!";
      case "invalidDate":
        return "You entered invalid date!";
      case "asyncValidationError":
        return "Oops! Something went wrong while performing validation!";
    }
  };
}

type MyFormProps = {
  getMinAge: (country: string) => number;
  validateCoupon: (coupon: string) => Promise<boolean>;
  onSubmit: (values: Form.Values) => void;
};

export const MyForm: React.FC<MyFormProps> = ({
  getMinAge,
  onSubmit,
  validateCoupon,
}) => {
  const validator = React.useMemo(
    () => Form.getValidator({ getMinAge, validateCoupon }),
    [getMinAge, validateCoupon]
  );

  const [, form, FormtsProvider] = useFormts({
    Schema: Form.Schema,
    transformer: Form.transformer,
    validator,
    initialValues: {
      name: "Keanu Reeves",
    },
  });

  return (
    <FormtsProvider>
      <form onSubmit={form.getSubmitHandler(onSubmit)}>
        <Fields.Title />
        <Fields.Name />
        <Fields.Age />
        <Fields.DateOfPurchase />
        <Fields.Coupons />
        <Fields.Address />
        <Fields.Notes />

        <button type="submit" disabled={form.isSubmitting || form.isValidating}>
          Submit
        </button>
      </form>
    </FormtsProvider>
  );
};

namespace Fields {
  /**
   * Radio group example
   */
  export const Title = React.memo(() => {
    const field = useField(Form.Schema.title);

    return (
      <fieldset>
        <legend>Title:</legend>

        {Object.values(field.options).map(value => (
          <div>
            <input
              type="radio"
              id={field.id + value}
              name={field.id}
              value={value}
              checked={field.value === value}
              onChange={field.handleChange}
            />
            <label htmlFor={field.id + value}>{value}</label>
          </div>
        ))}

        {Form.renderError(field.error)}
      </fieldset>
    );
  });

  export const Name = React.memo(() => {
    const field = useField(Form.Schema.name);

    return (
      <>
        <label htmlFor={field.id}>Name:</label>
        <input
          id={field.id}
          value={field.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
        />
        {Form.renderError(field.error)}
      </>
    );
  });

  export const Age = React.memo(() => {
    const field = useField(Form.Schema.age);

    return (
      <>
        <label htmlFor={field.id}>Age:</label>
        <input
          type="number"
          id={field.id}
          value={field.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
        />
        {Form.renderError(field.error)}
      </>
    );
  });

  export const DateOfPurchase = React.memo(() => {
    const field = useField(Form.Schema.dateOfPurchase);

    // what a mess, see https://github.com/facebook/react/issues/11369
    const dateString = field.value
      ? `${field.value.getFullYear()}-${field.value.getMonth()}-${field.value.getDate()}`
      : "";

    return (
      <>
        <label htmlFor={field.id}>Date of purchase:</label>
        <input
          type="date"
          id={field.id}
          value={dateString}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
        />
        {Form.renderError(field.error)}
      </>
    );
  });

  /**
   * Field array example
   */
  export const Coupons = React.memo(() => {
    const couponsField = useField(Form.Schema.coupons.root, {
      debounceChangesMs: 250,
    });

    return (
      <fieldset>
        <legend>Coupons:</legend>

        {couponsField.children.map((field, i) => (
          <div key={field.id}>
            <input
              value={field.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
            />
            {Form.renderError(field.error)}
            <button onClick={() => couponsField.removeItem(i)}>Remove</button>
          </div>
        ))}

        <button onClick={() => couponsField.pushItem("")}>Add</button>
      </fieldset>
    );
  });

  /**
   * select example
   */
  export const Address = React.memo(() => {
    const addressField = useField(Form.Schema.address.root);
    const {
      country: countryField,
      street: streetField,
      zipCode: zipCodeField,
    } = addressField.children;

    return (
      <fieldset>
        <legend>Address:</legend>

        <label htmlFor={countryField.id}>Country:</label>
        <select
          id={countryField.id}
          value={countryField.value}
          onChange={countryField.handleChange}
          onBlur={countryField.handleBlur}
        >
          <option value="" label="Select a country" />
          <option value="PL" label="Poland" />
          <option value="UK" label="United Kingdom" />
          <option value="DE" label="Deutschland" />
          <option value="US" label="United States" />
        </select>
        {Form.renderError(countryField.error)}

        <label htmlFor={streetField.id}>Street:</label>
        <input
          id={streetField.id}
          value={streetField.value}
          onChange={streetField.handleChange}
          onBlur={streetField.handleBlur}
        />
        {Form.renderError(streetField.error)}

        <label htmlFor={zipCodeField.id}>Zip Code:</label>
        <input
          id={zipCodeField.id}
          value={zipCodeField.value}
          onChange={zipCodeField.handleChange}
          onBlur={zipCodeField.handleBlur}
        />
        {Form.renderError(zipCodeField.error)}

        {Form.renderError(addressField.error)}
      </fieldset>
    );
  });

  export const Notes = React.memo(() => {
    const field = useField(Form.Schema.notes);

    return (
      <>
        <label htmlFor={field.id}>Notes:</label>
        <textarea
          id={field.id}
          value={field.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
          rows={5}
        />
        {Form.renderError(field.error)}
      </>
    );
  });
}
