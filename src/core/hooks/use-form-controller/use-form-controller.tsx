import { useCallback, useMemo } from "react";

import { FormAtoms } from "../../atoms";
import {
  FormController,
  _FormControllerImpl,
} from "../../types/form-controller";
import { InternalFormtsContext } from "../../types/formts-context";
import { FormtsOptions } from "../../types/formts-options";
import { opaque } from "../../types/type-mapper-util";

import { createStateDispatch, getInitialState } from "./formts-dispatch";
import { createFormtsMethods } from "./formts-methods";

/**
 * Hook that manages form state - should be used in main form component.
 * Does not cause the component to subscribe to any form state changes.
 *
 * @param options `FormtsOptions` used to configure form. Requires Schema created using `FormSchemaBuilder`.
 *
 * @returns `FormController` object which connects other hooks to form state.
 * Can be passed directly to other hooks or via `FormProvider` component.
 *
 * @example
 * ```ts
 * const Schema = new FormSchemaBuilder()...;
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
  const dispatch = useCallback(createStateDispatch(state, options), [state]);
  const atoms = useMemo(() => new FormAtoms(state, options.Schema), [state]);
  const methods = useMemo(
    () => createFormtsMethods({ options, state, dispatch }),
    [state, dispatch, options.validator]
  );

  const __ctx: InternalFormtsContext<Values, Err> = useMemo(
    () => ({
      options,
      state,
      methods,
      atoms,
    }),
    [state, methods, atoms]
  );

  return useMemo(() => opaque({ __ctx }), [__ctx]);
};
