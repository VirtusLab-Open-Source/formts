import { keys, toIdentityDict } from "../../../utils";
import { Task } from "../../../utils/task";
import { useSubscription } from "../../../utils/use-subscription";
import { useFormtsContext } from "../../context";
import * as Helpers from "../../helpers";
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
import { FormtsAtomState } from "../../types/formts-state";
import { impl } from "../../types/type-mapper-util";
import {
  FieldStateAtom,
  FieldStateAtomCache,
} from "../use-form-controller/atom-cache";

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
 * const Schema = new FormSchemaBuilder()...;
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
  const {
    methods,
    state,
    fieldStateCache,
    fieldDependenciesCache,
  } = useFormtsContext<object, Err>(controller);

  const fieldState = fieldStateCache.get(fieldDescriptor);
  const dependencies = fieldDependenciesCache.get(fieldDescriptor);

  useSubscription(fieldState);
  useSubscription(dependencies);

  return createFieldHandle(
    fieldDescriptor,
    methods,
    fieldState,
    state,
    fieldStateCache
  );
};

const createFieldHandle = <T, Err>(
  descriptor: FieldDescriptor<T, Err>,
  methods: InternalFormtsMethods<object, Err>,
  fieldState: FieldStateAtom<T>,
  formState: FormtsAtomState<object, Err>,
  fieldStateCache: FieldStateAtomCache<object, Err>
): FieldHandle<T, Err> =>
  toFieldHandle({
    descriptor,

    id: impl(descriptor).__path,

    value: fieldState.val.value,

    get isTouched() {
      return (
        fieldState.val.formSubmitted ||
        Helpers.resolveTouched(fieldState.val.touched)
      );
    },

    get error() {
      return formState.errors.val[impl(descriptor).__path] ?? null;
    },

    get isValid() {
      return Helpers.resolveIsValid(formState.errors.val, descriptor);
    },

    get isValidating() {
      return Helpers.resolveIsValidating(formState.validating.val, descriptor);
    },

    get children() {
      if (isObjectDescriptor(descriptor)) {
        return keys(descriptor).reduce(
          (acc, key) =>
            Object.defineProperty(acc, key, {
              enumerable: true,
              get: function () {
                const nestedDescriptor = descriptor[key];
                const childState = fieldStateCache.get(nestedDescriptor);
                return createFieldHandle(
                  nestedDescriptor,
                  methods,
                  childState,
                  formState,
                  fieldStateCache
                );
              },
            }),
          {}
        );
      }

      if (isArrayDescriptor(descriptor)) {
        const value = (fieldState.val.value as unknown) as unknown[];
        return value.map((_, i) => {
          const childDescriptor = descriptor.nth(i);
          const childState = fieldStateCache.get(childDescriptor);
          return createFieldHandle(
            descriptor.nth(i),
            methods,
            childState,
            formState,
            fieldStateCache
          );
        });
      }

      return undefined;
    },

    get options() {
      const decoder = impl(descriptor).__decoder;
      return isChoiceDecoder(decoder)
        ? toIdentityDict((decoder.options as string[]).filter(opt => opt != ""))
        : undefined;
    },

    handleBlur: () =>
      Task.all(
        methods.touchField(descriptor),
        methods.validateField(descriptor, "blur")
      ).runPromise(),

    setValue: val => methods.setFieldValue(descriptor, val).runPromise(),

    handleChange: event =>
      methods.setFieldValueFromEvent(descriptor, event).runPromise(),

    setError: error =>
      methods
        .setFieldErrors({ path: impl(descriptor).__path, error })
        .runPromise(),

    addItem: item => {
      if (isArrayDescriptor(descriptor)) {
        const array = (fieldState.val.value as unknown) as unknown[];
        const updatedArray = [...array, item];
        return methods.setFieldValue(descriptor, updatedArray).runPromise();
      }

      return Promise.resolve();
    },

    removeItem: index => {
      if (isArrayDescriptor(descriptor)) {
        const array = (fieldState.val.value as unknown) as unknown[];
        const updatedArray = array.filter((_, i) => i !== index);
        return methods.setFieldValue(descriptor, updatedArray).runPromise();
      }

      return Promise.resolve();
    },

    validate: () => methods.validateField(descriptor).runPromise(),
  });
