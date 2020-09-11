/**
 *
 * Example showing composition of validators for single field.
 * This means running multiple validation rules at the same time
 * instead of one at a time until first error is found.
 *
 */
import React from "react";

import { createForm, useFormts } from "formts";

import {
  BaseErrors,
  required,
  minLength,
  hasSpecialChar,
  hasUpperCaseChar,
  hasLowerCaseChar,
} from "formts/validators";

const containsAnswerToLifeUniverseAndEverything = () => (val: string) =>
  /42/.test(val) ? null : { code: "lacksTheAnswer" as const };

const validPassword = () => (value: string) => {
  const rules = [
    minLength(20),
    hasSpecialChar(),
    hasUpperCaseChar(),
    hasLowerCaseChar(),
    containsAnswerToLifeUniverseAndEverything(),
  ] as const;
  const problems = rules.map(rule => rule(value)).filter(err => err != null);

  return problems.length > 0
    ? { code: "invalidPassword" as const, problems }
    : null;
};

type FormError =
  | BaseErrors.Required
  | ReturnType<ReturnType<typeof validPassword>>;

const Schema = createForm.schema(
  fields => ({
    password: fields.string(),
  }),
  errors => errors<FormError>()
);

const validator = createForm.validator(Schema, validate => [
  validate({
    field: Schema.password,
    rules: () => [required(), validPassword()],
  }),
]);

export const MyForm: React.FC = () => {
  const [fields, form] = useFormts({ Schema, validator });
  const onSubmit = form.getSubmitHandler(values => console.log(values));

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor={fields.password.id}>Please create a password</label>
      <input
        type="password"
        id={fields.password.id}
        value={fields.password.value}
        onChange={fields.password.handleChange}
        onBlur={fields.password.handleBlur}
      />

      {fields.password.error?.code === "required" && <div>Required!</div>}

      {fields.password.error?.code === "invalidPassword" && (
        <div>
          <div>The password doesn't satisfy all requirements!</div>
          {fields.password.error.problems.map(err => {
            switch (err?.code) {
              case "minLength":
                return (
                  <div key={err.code}>
                    - Password must be at least {err?.min} characters long!
                  </div>
                );
              case "lacksLowerCaseChar":
                return (
                  <div key={err.code}>
                    - Password must contain at least one uppercase character!
                  </div>
                );
              case "lacksUpperCaseChar":
                return (
                  <div key={err.code}>
                    - Password must contain at least one lowercase character!
                  </div>
                );
              case "lacksSpecialChar":
                return (
                  <div key={err.code}>
                    - Password must contain at least one special character!
                  </div>
                );
              case "lacksTheAnswer":
                return (
                  <div key={err.code}>
                    - Password must contain The Answer to Life, the Universe and
                    Everything!
                  </div>
                );
            }
          })}
        </div>
      )}

      <button type="submit">Submit</button>
    </form>
  );
};
