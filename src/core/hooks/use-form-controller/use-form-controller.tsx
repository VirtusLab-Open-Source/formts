import { useCallback, useMemo } from "react";

import {
  FormController,
  _FormControllerImpl,
} from "../../types/form-controller";
import { InternalFormtsContext } from "../../types/formts-context";
import { FormtsOptions } from "../../types/formts-options";
import { opaque } from "../../types/type-mapper-util";

import { FieldDependenciesAtomCache, FieldStateAtomCache } from "./atom-cache";
import { createStateDispatch, getInitialState } from "./formts-dispatch";
import { createFormtsMethods } from "./formts-methods";

/**
 * Hook that manages form state - should be used in main form component.
 * Does not cause the component to subscribe to any form state changes.
 *
 * @param options `FormtsOptions` used to configure form. Requires Schema created using `createFormSchema` function.
 *
 * @returns `FormController` object which connects other hooks to form state.
 * Can be passed directly to other hooks or via `FormProvider` component.
 *
 * @example
 * ```ts
 * const Schema = createFormSchema(...);
 *
 * const MyForm: React.FC = () => {
 *   const controller = useFormController({ Schema })
 *   const formHandle = useFormHandle(Schema, controller)
 *
 *   ...
 * }
 * ```
 */
export const useFormController = <Values extends object, Err>(
  options: FormtsOptions<Values, Err>
): FormController => {
  const state = useMemo(() => getInitialState(options), []);
  const dispatch = useCallback(createStateDispatch(state), [state]);

  const fieldStateCache = useMemo(() => new FieldStateAtomCache(state), [
    state,
  ]);
  const fieldDependenciesCache = useMemo(
    () => new FieldDependenciesAtomCache(state),
    [state]
  );

  const methods = useMemo(
    () => createFormtsMethods({ options, state, dispatch }),
    [state, dispatch, options.validator]
  );

  const __ctx: InternalFormtsContext<Values, Err> = useMemo(
    () => ({
      options,
      state,
      methods,
      fieldStateCache,
      fieldDependenciesCache,
    }),
    [state, methods, fieldStateCache, fieldDependenciesCache]
  );

  return opaque({ __ctx });
};
