import {
  createFormSchema,
  createFormValidator,
  FormProvider,
  useField,
  useFormController,
  useFormHandle,
  useFormValues,
} from "@virtuslab/formts";
import * as V from "@virtuslab/formts/validators";
import React from "react";
import ReactDOM from "react-dom";

import "../index.css";

const MIN_PASS_LEN = 8;

const Schema = createFormSchema(
  field => ({
    currentPass: field.string(),
    newPass: field.string(),
    newPassConfirm: field.string(),
  }),
  err => err<FormError>()
);

type FormError =
  | V.Errors.Required
  | V.ErrorType<typeof passwordMultiValidator>
  | { code: "confirmPassMismatch" }
  | { code: "invalidCurrentPass" };

const passwordMultiValidator = V.combine(
  [
    V.minLength(MIN_PASS_LEN),
    V.hasLowerCaseChar(),
    V.hasUpperCaseChar(),
    val => (val.includes("42") ? null : ({ code: "hasTheAnswer" } as const)),
  ],
  ([minLen, lowerChar, upperChar, hasTheAnswer]) => ({
    code: "passwordFormat" as const,
    rules: {
      minLen,
      lowerChar,
      upperChar,
      hasTheAnswer,
    },
  })
);

const validator = createFormValidator(Schema, validate => [
  validate(Schema.currentPass, V.required()),

  validate(Schema.newPass, passwordMultiValidator),

  validate(Schema.newPassConfirm, V.required()),
  validate({
    field: Schema.newPassConfirm,
    dependencies: [Schema.newPass],
    triggers: ["blur", "submit"],
    rules: newPass => [
      val =>
        val !== newPass ? { code: "confirmPassMismatch" as const } : null,
    ],
  }),
]);

export const Example: React.FC = () => {
  const controller = useFormController({ Schema, validator });

  return (
    <FormProvider controller={controller}>
      <CurrentPassInput />
      <NewPassInput />
      <NewPassConfirmInput />
      <FormActions />
      <Debug />
    </FormProvider>
  );
};

const CurrentPassInput: React.FC = () => {
  const field = useField(Schema.currentPass);

  return (
    <section>
      <label htmlFor={field.id}>current password</label>
      <input
        id={field.id}
        value={field.value}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
        placeholder="pass123"
        type="password"
      />
      <ErrMessage error={field.error} />
    </section>
  );
};

const NewPassInput: React.FC = () => {
  const field = useField(Schema.newPass);

  const renderRequirement = (
    rule: keyof V.ErrorType<typeof passwordMultiValidator>["rules"],
    label: string
  ) => {
    const ruleError =
      (field.error?.code === "passwordFormat" && field.error.rules[rule]) ||
      null;

    const cls = ruleError
      ? "multi-rule--error"
      : !field.isTouched
      ? "multi-rule--incomplete"
      : "multi-rule--complete";

    return <li className={cls}>{label}</li>;
  };

  return (
    <section>
      <label htmlFor={field.id}>new password</label>
      <input
        id={field.id}
        value={field.value}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
        type="password"
      />
      <ul>
        {renderRequirement("minLen", `at least ${MIN_PASS_LEN} characters`)}
        {renderRequirement("lowerChar", "at least 1 lowercase character")}
        {renderRequirement("upperChar", "at least 1 uppercase character")}
        {renderRequirement(
          "hasTheAnswer",
          "contains the answer to life, universe and everything"
        )}
      </ul>
    </section>
  );
};

const NewPassConfirmInput: React.FC = () => {
  const field = useField(Schema.newPassConfirm);

  return (
    <section>
      <label htmlFor={field.id}>confirm new password</label>
      <input
        id={field.id}
        value={field.value}
        onChange={field.handleChange}
        onBlur={field.handleBlur}
        type="password"
      />
      <ErrMessage error={field.error} />
    </section>
  );
};

const ErrMessage: React.FC<{ error: FormError | null }> = ({ error }) => {
  const messages: Record<FormError["code"], string> = {
    confirmPassMismatch: "Provided value does not match new password value!",
    invalidCurrentPass: "Invalid password! Please enter your current password.",
    passwordFormat: "Invalid password format.", // this is handled in details via dedicated UI,
    required: "Field is required!",
  };

  return error != null ? (
    <div className="error">{messages[error.code]}</div>
  ) : null;
};

const FormActions: React.FC = () => {
  const form = useFormHandle(Schema);

  const onSubmit = () =>
    form.submit(async ({ currentPass, newPass }) => {
      const result = await fakeChangePassEndpoint({
        currentPass,
        newPass,
      });

      if (result.ok) {
        alert("password changed!");
      } else {
        // in real life some conversion from server error to form error would be needed
        form.setFieldError(Schema.currentPass, result.err);
      }
    }, console.warn);

  return (
    <section>
      <button onClick={onSubmit} disabled={form.isSubmitting || !form.isValid}>
        {form.isSubmitting ? "Processing..." : "Submit!"}
      </button>
    </section>
  );
};

const fakeChangePassEndpoint = (body: {
  currentPass: string;
  newPass: string;
}): Promise<Result<void, FormError>> =>
  new Promise(resolve => {
    setTimeout(() => {
      if (body.currentPass !== "pass123") {
        resolve({ ok: false, err: { code: "invalidCurrentPass" } });
      }

      resolve({ ok: true, val: undefined });
    }, 1000);
  });

const Debug: React.FC = () => {
  const form = useFormHandle(Schema);
  const values = useFormValues(Schema);

  const currentPass = useField(Schema.currentPass);
  const newPass = useField(Schema.newPass);
  const newPassConfirm = useField(Schema.newPassConfirm);

  const info = {
    values,
    form,
    fields: { currentPass, newPass, newPassConfirm },
  };

  return (
    <pre>
      <h3>Debug</h3>
      {JSON.stringify(info, null, 2)}
    </pre>
  );
};

type Result<T, E> = { ok: true; val: T } | { ok: false; err: E };

ReactDOM.render(<Example />, document.getElementById("root"));
