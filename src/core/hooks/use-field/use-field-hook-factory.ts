import { keys, toIdentityDict } from "../../../utils";
import { isChoiceDecoder } from "../../types/field-decoder";
import {
  FieldDescriptor,
  isArrayDescriptor,
  isObjectDescriptor,
} from "../../types/field-descriptor";
import { FieldHandle, toFieldHandle } from "../../types/field-handle";
import { FormProvider } from "../../types/form-provider";
import {
  HookFactoryContext,
  InternalFormtsMethods,
} from "../../types/formts-context";
import { impl } from "../../types/type-mapper-util";
import { useInternalFormtsContext } from "../use-form-provider";

export type UseFieldHook<Values extends object, Err> = {
  /**
   * useField // TODO
   */
  <T>(
    field: FieldDescriptor<T, Err>,
    Provider?: FormProvider<Values, Err>
  ): FieldHandle<T, Err>;
};

export const useFieldHookFactory = <Values extends object, Err>({
  Schema,
  Context,
}: HookFactoryContext<Values, Err>): UseFieldHook<Values, Err> => <T>(
  field: FieldDescriptor<T, Err>,
  Provider?: FormProvider<Values, Err>
) => {
  const { methods } = useInternalFormtsContext({
    Schema,
    Context,
    Provider,
  });

  return createFieldHandle(field, methods);
};

const createFieldHandle = <T, Values extends object, Err>(
  descriptor: FieldDescriptor<T, Err>,
  methods: InternalFormtsMethods<Values, Err>
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
        ? toIdentityDict(decoder.options as string[])
        : undefined;
    },

    handleBlur: () => {
      methods.touchField(descriptor);
      return methods.validateField(descriptor, "blur");
    },

    setValue: val => {
      return methods.setFieldValue(descriptor, val);
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
