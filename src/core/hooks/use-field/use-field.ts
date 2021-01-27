import { keys, toIdentityDict } from "../../../utils";
import { Atom } from "../../../utils/atoms";
import { useSubscription } from "../../../utils/use-subscription";
import { useFormtsContext } from "../../context";
import { isChoiceDecoder } from "../../types/field-decoder";
import {
  FieldDescriptor,
  GenericFieldDescriptor,
  isArrayDescriptor,
  isObjectDescriptor,
} from "../../types/field-descriptor";
import { FieldHandle, toFieldHandle } from "../../types/field-handle";
import { FormController } from "../../types/form-controller";
import { InternalFormtsMethods } from "../../types/formts-context";
import { impl } from "../../types/type-mapper-util";

/**
 * Hook used to gain access to field-specific state and methods
 * Causes the component to subscribe to all changes of the field's state.
 *
 * @param fieldDescriptor - pointer to a field containing type information and more. Obtained from FormSchema.
 * @param controller - obtained by using `useFormController` hook, used to connect to form state.
 * Injected automatically via React Context when used inside `FormProvider` component.
 *
 * @returns `FormHandle` object used to interact with the field
 *
 * @example
 * ```ts
 * const Schema = createFormSchema(...);
 *
 * const MyForm: React.FC = () => {
 *   const controller = useFormController({ Schema })
 *   const username = useField(Schema.username, controller)
 *
 *   ...
 * }
 * ```
 */
export const useField = <T, Err>(
  fieldDescriptor: GenericFieldDescriptor<T, Err>,
  controller?: FormController
): FieldHandle<T, Err> => {
  const { methods, state } = useFormtsContext<object, Err>(controller);

  const lens = impl(fieldDescriptor).__lens;
  const valueAtom = Atom.entangle(state.values, lens);
  const touchedAtom = Atom.entangle(state.touched, lens);

  useSubscription(valueAtom);
  useSubscription(touchedAtom);
  useSubscription(state.validating);
  useSubscription(state.errors);

  return createFieldHandle(fieldDescriptor, methods);
};

const createFieldHandle = <T, Err>(
  descriptor: FieldDescriptor<T, Err>,
  methods: InternalFormtsMethods<object, Err>
): FieldHandle<T, Err> =>
  toFieldHandle({
    descriptor,

    id: impl(descriptor).__path,

    get value() {
      return methods.getField(descriptor);
    },

    get isTouched() {
      return methods.isFieldTouched(descriptor);
    },

    get error() {
      return methods.getFieldError(descriptor);
    },

    get isValid() {
      return methods.isFieldValid(descriptor);
    },

    get isValidating() {
      return methods.isFieldValidating(descriptor);
    },

    get children() {
      if (isObjectDescriptor(descriptor)) {
        return keys(descriptor).reduce(
          (acc, key) =>
            Object.defineProperty(acc, key, {
              enumerable: true,
              get: function () {
                const nestedDescriptor = descriptor[key];
                return createFieldHandle(nestedDescriptor, methods);
              },
            }),
          {}
        );
      }

      if (isArrayDescriptor(descriptor)) {
        const value = methods.getField(descriptor) as unknown[];
        return value.map((_, i) =>
          createFieldHandle(descriptor.nth(i), methods)
        );
      }

      return undefined;
    },

    get options() {
      const decoder = impl(descriptor).__decoder;
      return isChoiceDecoder(decoder)
        ? toIdentityDict((decoder.options as string[]).filter(opt => opt != ""))
        : undefined;
    },

    handleBlur: () => {
      methods.touchField(descriptor);
      return methods.validateField(descriptor, "blur");
    },

    setValue: val => {
      return methods.setFieldValue(descriptor, val);
    },

    handleChange: event => {
      return methods.setFieldValueFromEvent(descriptor, event);
    },

    setError: error => {
      methods.setFieldErrors({ field: descriptor, error });
    },

    addItem: item => {
      if (isArrayDescriptor(descriptor)) {
        const array = methods.getField(descriptor) as unknown[];
        const updatedArray = [...array, item];
        return methods.setFieldValue(descriptor, updatedArray);
      }

      return undefined;
    },

    removeItem: index => {
      if (isArrayDescriptor(descriptor)) {
        const array = methods.getField(descriptor) as unknown[];
        const updatedArray = array.filter((_, i) => i !== index);
        return methods.setFieldValue(descriptor, updatedArray);
      }

      return undefined;
    },

    validate: () => {
      return methods.validateField(descriptor);
    },
  });
