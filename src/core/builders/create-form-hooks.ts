import React from "react";

import {
  UseFormHandleHook,
  useFormHandleHookFactory,
} from "../hooks/use-form-handle";
import {
  UseFormProviderHook,
  useFormProviderHookFactory,
} from "../hooks/use-form-provider";
import { FormSchema } from "../types/form-schema";
import { InternalFormtsContext } from "../types/formts-context";

type FormHooks<Values extends object, Err> = {
  useFormProvider: UseFormProviderHook<Values, Err>;
  useFormHandle: UseFormHandleHook<Values, Err>;
};

export const createFormHooks = <Values extends object, Err>(
  Schema: FormSchema<Values, Err>
): FormHooks<Values, Err> => {
  type CtxType = InternalFormtsContext<Values, Err> | undefined;
  const Context = React.createContext<CtxType>(undefined);

  return {
    useFormProvider: useFormProviderHookFactory({ Schema, Context }),
    useFormHandle: useFormHandleHookFactory({ Schema, Context }),
  };
};
