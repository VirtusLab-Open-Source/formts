import { FieldDescriptor } from "./descriptors";
import { FieldHandle } from "./field-handle";

type Options = {
  /** If provided - all changes will be cached in local state with debounced propagation to form controller and validators */
  debounceChangesMs?: number;
};

/**
 * Hook used to interact with given form field.
 * Will cause component to subscribe to all state changes of the field.
 * Can be used together with `React.memo` to limit re-rendering of nested form components.
 * Must be used together with `FormtsProvider` received from `useFormts` hook.
 *
 * @example
 * ```
 * const NameField = () => {
 *   const field = useField(Schema.name);
 *   return (
 *     <input
 *       value={field.value}
 *       onChange={field.onChange}
 *       onBlur={field.onBlur}
 *     />
 *   );
 * }
 * ```
 *
 * @param fieldDescriptor pointer to a form field
 */
export const useField = <T, Err>(
  fieldDescriptor: FieldDescriptor<T, Err>,
  options?: Options
): FieldHandle<T, Err> => {
  throw new Error("not implemented!");
};
