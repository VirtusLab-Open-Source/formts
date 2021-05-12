import { useSubscription } from "../../../utils/use-subscription";
import { useFormtsContext } from "../../context";
import { FormController } from "../../types/form-controller";
import { FormSchema } from "../../types/form-schema";

/**
 * Hook used to gain access to values of all form fields.
 * Causes the component to subscribe to changes of all field values.
 *
 * @param Schema - created using `FormSchemaBuilder`, needed for type inference.
 * @param controller - obtained by using `useFormController` hook, used to connect to form state.
 * Injected automatically via React Context when used inside `FormProvider` component.
 *
 * @returns object containing values of all fields. It's shape is determined by `FormSchema`
 *
 * @example
 * ```ts
 * const Schema = new FormSchemaBuilder()...;
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
  useSubscription(state.values);
  return state.values.val;
};
