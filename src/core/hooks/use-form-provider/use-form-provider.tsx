import React from "react";

import { DeepPartial } from "../../../utils";
import { FormProvider, _FormProviderImpl } from "../../types/form-provider";
import { FormValidator } from "../../types/form-validator";
import {
  HookFactoryContext,
  InternalFormtsContext,
} from "../../types/formts-context";
import { impl, opaque } from "../../types/type-mapper-util";

import { createReducer, getInitialState } from "./reducer";

export type FormtsOptions<Values extends object, Err> = {
  /**
   * Values used to override the defaults when filling the form
   * after the component is mounted or after form reset (optional).
   * The defaults depend on field type (defined in the Schema).
   */
  initialValues?: DeepPartial<Values>;

  /** Form validator created using `createForm.validator` function (optional). */
  validator?: FormValidator<Values, Err>;
};

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

  const context: InternalFormtsContext<Values, Err> = {
    options,
    state,
    dispatch,
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

export const useInternalFormtsContext = <Values extends object, Err>(
  { Context, Schema }: HookFactoryContext<Values, Err>,
  Provider?: FormProvider<Values, Err>
): InternalFormtsContext<Values, Err> => {
  const ctx = React.useContext(Context);
  if (ctx != null) return ctx;

  if (!Provider) {
    throw new Error("FormProvider not found!");
  }

  if (impl(Provider).__schema !== Schema) {
    throw new Error("FormSchema mismatch!");
  }

  return impl(Provider).__ctx;
};
