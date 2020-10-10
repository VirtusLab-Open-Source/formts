import { DeepPartial } from "../../utils";

type FieldError<Err> = {
  path: string;
  error: Err;
};

/**
 * Used to interact with the form as a whole
 */
export type FormHandle<Values extends object, Err> = {
  /** Form values */
  values: Values;

  /** Array containing all form errors together with respective field paths */
  errors: Array<FieldError<Err>>;

  /** True if any form field is touched */
  isTouched: boolean;

  /** True if there are no validation errors */
  isValid: boolean;

  /** True if validation process of any field is ongoing */
  isValidating: boolean;

  /** True if form submission process is ongoing (due to validation on submit or unfulfilled Promise returned from submit handler) */
  isSubmitting: boolean;

  /**
   * Resets the form cleaning all validation errors and touched flags.
   * Form values will be set to initial values or to provided object.
   */
  reset: (values?: DeepPartial<Values>) => void;

  /**
   * Runs validation of all fields.
   * Use this together with `React.useEffect` hook if you want to run form validation on init.
   */
  validate: () => void;

  /**
   * Creates `onSubmit` handler function which can be passed to `<form>` or `<button>` or invoked imperatively.
   *
   * @param onSuccess - function invoked after successful submit validation.
   * Receives form values. Can return Promise which will affect `isSubmitting` flag.
   *
   * @param onFailure - function invoked after failed submit validation. Receives form errors. (optional)
   */
  getSubmitHandler: (
    onSuccess: (values: Values) => void | Promise<unknown>,
    onFailure?: (errors: Array<FieldError<Err>>) => void
  ) => (event?: any) => void;
};
