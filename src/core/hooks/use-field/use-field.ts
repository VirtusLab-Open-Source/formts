import { useMemo } from "react";

import { keys, toIdentityDict } from "../../../utils";
import { Atom } from "../../../utils/atoms";
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
import { FormtsAtomState, TouchedValues } from "../../types/formts-state";
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

  const fieldState = useMemo(
    () => createFieldState(state, fieldDescriptor, true),
    [state, impl(fieldDescriptor).__path]
  );

  useSubscription(fieldState);

  return createFieldHandle(fieldDescriptor, methods, fieldState, state);
};

type FieldState<T> = Atom.Readonly<{
  value: T;
  touched: TouchedValues<T>;
}>;

const createFieldState = <T, Err>(
  state: FormtsAtomState<object, Err>,
  field: FieldDescriptor<T, Err>,
  includeTriggers: boolean = false
): FieldState<T> => {
  const lens = impl(field).__lens;

  return includeTriggers
    ? Atom.fuse(
        (value, touched, _branchErrors, _branchValidating) => ({
          value,
          touched: touched as any,
        }),
        Atom.entangle(state.values, lens),
        Atom.entangle(state.touched, lens),
        Atom.fuse(
          x => Helpers.constructBranchErrorsString(x, field),
          state.errors
        ),
        Atom.fuse(
          x => Helpers.constructBranchValidatingString(x, field),
          state.validating
        )
      )
    : Atom.fuse(
        (value, touched) => ({
          value,
          touched: touched as any,
        }),
        Atom.entangle(state.values, lens),
        Atom.entangle(state.touched, lens)
      );
};

const createFieldHandle = <T, Err>(
  descriptor: FieldDescriptor<T, Err>,
  methods: InternalFormtsMethods<object, Err>,
  fieldState: FieldState<T>,
  formState: FormtsAtomState<object, Err>
): FieldHandle<T, Err> =>
  toFieldHandle({
    descriptor,

    id: impl(descriptor).__path,

    value: fieldState.val.value,

    get isTouched() {
      return Helpers.resolveTouched(fieldState.val.touched);
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
                const childState = createFieldState(
                  formState,
                  nestedDescriptor
                );
                return createFieldHandle(
                  nestedDescriptor,
                  methods,
                  childState,
                  formState
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
          const childState = createFieldState(formState, childDescriptor);
          return createFieldHandle(
            descriptor.nth(i),
            methods,
            childState,
            formState
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
        const array = (fieldState.val.value as unknown) as unknown[];
        const updatedArray = [...array, item];
        return methods.setFieldValue(descriptor, updatedArray);
      }

      return undefined;
    },

    removeItem: index => {
      if (isArrayDescriptor(descriptor)) {
        const array = (fieldState.val.value as unknown) as unknown[];
        const updatedArray = array.filter((_, i) => i !== index);
        return methods.setFieldValue(descriptor, updatedArray);
      }

      return undefined;
    },

    validate: () => {
      return methods.validateField(descriptor);
    },
  });
