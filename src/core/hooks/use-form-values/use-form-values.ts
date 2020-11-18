import { useFormtsContext } from "../../context";
import { FormController } from "../../types/form-controller";
import { FormSchema } from "../../types/form-schema";

/**
 * Hook used to gain access to values of all form fields.
 * Causes the component to subscribe to changes of all field values.
 *
 * @param Schema - obtained by calling `createFormSchema` function, used to infer types.
 * @param controller - obtained by using `useFormController` hook, used to connect to form state.
 * Injected automatically via React Context when used inside `FormProvider` component.
 *
 * @returns object containing values of all fields. It's shape is determined by `FormSchema`
 *
 * @example
 * ```ts
 * const Schema = createFormSchema(...);
 *
 * const MyForm: React.FC = () => {
 *   const controller = useFormController({ Schema })
 *   const values = useFormValues(Schema, controller)
 *
 *   ...
 * }
 * ```
 */
export const useFormValues = <Values extends object, Err>(
  _Schema: FormSchema<Values, Err>,
  controller?: FormController
): Values => {
  const { state } = useFormtsContext<Values, Err>(controller);

  return state.values;
};
