import { useCallback, useMemo } from "react";

import { useSubscription } from "../../../utils/use-subscription";
import {
  FormController,
  _FormControllerImpl,
} from "../../types/form-controller";
import { FormtsOptions } from "../../types/formts-options";
import { opaque } from "../../types/type-mapper-util";

import { createFormtsMethods } from "./formts-methods";
import { createStateDispatch, getInitialState } from "./formts-reducer";

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

  const methods = createFormtsMethods({ options, state: state.val, dispatch });

  useSubscription(state); // TODO move to proper hooks

  const controller: _FormControllerImpl<Values, Err> = {
    __ctx: { options, state: state.val, methods },
  };

  return opaque(controller);
};
