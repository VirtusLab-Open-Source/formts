import React from "react";

import { FormProvider, _FormProviderImpl } from "../../types/form-provider";
import { FormSchema } from "../../types/form-schema";
import { InternalFormtsContext } from "../../types/formts-context";
import { FormtsOptions } from "../../types/formts-options";
import { impl, opaque } from "../../types/type-mapper-util";

import { createFormtsMethods } from "./formts-methods";
import { createReducer, getInitialState } from "./formts-reducer";

const Context = React.createContext<
  InternalFormtsContext<any, any> | undefined
>(undefined);

export const useFormProvider = <Values extends object, Err>(
  options: FormtsOptions<Values, Err>
): FormProvider => {
  const [state, dispatch] = React.useReducer(
    createReducer<Values, Err>(),
    options,
    getInitialState
  );

  const methods = createFormtsMethods({ options, state, dispatch });

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
  });

  return opaque(ProviderExt);
};

type UseInternalCtxInput<Values extends object, Err> = {
  Provider?: FormProvider;
  Schema?: FormSchema<Values, Err>;
};
export const useInternalFormtsContext = <Values extends object, Err>({
  Provider,
}: UseInternalCtxInput<Values, Err>): InternalFormtsContext<Values, Err> => {
  const ctx = React.useContext(Context);
  if (ctx != null) return ctx;

  if (!Provider) {
    throw new Error("FormProvider not found!");
  }

  return impl<Values, Err>(Provider).__ctx;
};
