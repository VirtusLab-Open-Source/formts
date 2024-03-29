import { NoInfer } from "../../utils";

import { GenericFieldDescriptor } from "./field-descriptor";
import { FieldError } from "./field-error";
import { InitialValues } from "./formts-state";

/**
 * Used to interact with the form as a whole
 */
export type FormHandle<Values extends object, Err> = {
  /** True if any form field is touched */
  isTouched: boolean;

  /** True if any form field is changed */
  isChanged: boolean;

  /** True if there are no validation errors */
  isValid: boolean;

  /** True if validation process of any field is ongoing */
  isValidating: boolean;

  /** True if form submission process is ongoing (due to validation on submit or unfulfilled Promise returned from submit handler) */
  isSubmitting: boolean;

  submitCount: {
    /** will be incremented after every call of `submit` function, sum of `valid` and `invalid` counts. */
    total: number;
    /** will be incremented after every call of `submit` function when validation passes */
    valid: number;
    /** will be incremented after every failed call of `submit` function when validation fails */
    invalid: number;
  };

  /**
   * Resets the form cleaning all validation errors and touched flags.
   * Form values will be set to initial values.
   *
   * @param newInitialValues if provided will replace initialValues passed into `useFormController` hook.
   */
  reset: (newInitialValues?: InitialValues<Values>) => void;

  /**
   * Runs validation of all fields.
   * Use this together with `React.useEffect` hook if you want to run form validation on init.
   */
  validate: () => void;

  /**
   * Runs form validation with 'submit' trigger and invokes `onSuccess` or `onFailure` callback.
   * Sets `isSubmitting` flag to true when validation or `onSuccess` callback promise are running.
   * Freezes changes to form values during submission process.
   * Sets `isTouched` flag of all fields to true.
   *
   * @param onSuccess - callback invoked after successful submit validation.
   * Receives form values. Can return Promise which will affect `isSubmitting` flag.
   *
   * @param onFailure - callback invoked after failed submit validation. Receives all form errors. (optional)
   */
  submit: (
    onSuccess: (values: Values) => void | Promise<unknown>,
    onFailure?: (errors: Array<FieldError<Err>>) => void
  ) => void;

  /**
   * Sets value for given field.
   * Will cause field validation to run with the `change` trigger.
   * Will set `isTouched` flag for the field to `true`.
   */
  setFieldValue: <T>(
    field: GenericFieldDescriptor<T, Err>,
    value: NoInfer<T>
  ) => void;

  /** Sets error for given field, affecting it's `isValid` flag */
  setFieldError: <T>(
    field: GenericFieldDescriptor<T, Err>,
    error: Err | null
  ) => void;
};
