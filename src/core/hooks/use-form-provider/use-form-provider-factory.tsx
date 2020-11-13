import React from "react";

import { FormProvider, _FormProviderImpl } from "../../types/form-provider";
import {
  HookFactoryContext,
  InternalFormtsContext,
} from "../../types/formts-context";
import { FormtsOptions } from "../../types/formts-options";
import { opaque } from "../../types/type-mapper-util";

import { createFormtsMethods } from "./formts-methods";
import { createReducer, getInitialState } from "./formts-reducer";

export type UseFormProviderHook<Values extends object, Err> = {
  /**
   * useFormProvider // TODO
   */
  (opts: FormtsOptions<Values, Err>): FormProvider<Values, Err>;
};

export const useFormProviderHookFactory = <Values extends object, Err>({
  Schema,
  Context,
}: HookFactoryContext<Values, Err>): UseFormProviderHook<
  Values,
  Err
> => options => {
  const [state, dispatch] = React.useReducer(
    createReducer<Values, Err>(),
    { Schema, initialValues: options.initialValues },
    getInitialState
  );

  const methods = createFormtsMethods({ Schema, options, state, dispatch });

  const context: InternalFormtsContext<Values, Err> = {
    options,
    state,
    methods,
  };

  const Provider: React.FC = ({ children }) => {
    return <Context.Provider value={context}>{children}</Context.Provider>;
  };

  const ProviderExt: _FormProviderImpl<Values, Err> = Object.assign(Provider, {
    __ctx: context,
    __schema: Schema,
  });

  return opaque(ProviderExt);
};
