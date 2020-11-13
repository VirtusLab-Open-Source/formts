import { FormProvider } from "../../types/form-provider";
import { HookFactoryContext } from "../../types/formts-context";
import { useInternalFormtsContext } from "../use-form-provider";

export type UseFormValuesHook<Values extends object, Err> = {
  /**
   * useFormValues // TODO
   */
  (Provider?: FormProvider<Values, Err>): Values;
};

export const useFormValuesHookFactory = <Values extends object, Err>({
  Schema,
  Context,
}: HookFactoryContext<Values, Err>): UseFormValuesHook<
  Values,
  Err
> => Provider => {
  const { state } = useInternalFormtsContext({
    Schema,
    Context,
    Provider,
  });

  return state.values;
};
