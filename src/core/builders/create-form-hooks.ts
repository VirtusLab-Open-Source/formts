import React from "react";

import { UseFieldHook, useFieldHookFactory } from "../hooks/use-field";
import {
  UseFormHandleHook,
  useFormHandleHookFactory,
} from "../hooks/use-form-handle";
import {
  UseFormProviderHook,
  useFormProviderHookFactory,
} from "../hooks/use-form-provider";
import {
  UseFormValuesHook,
  useFormValuesHookFactory,
} from "../hooks/use-form-values";
import { FormSchema } from "../types/form-schema";
import { InternalFormtsContext } from "../types/formts-context";

type FormHooks<Values extends object, Err> = {
  useFormProvider: UseFormProviderHook<Values, Err>;
  useFormHandle: UseFormHandleHook<Values, Err>;
  useFormValues: UseFormValuesHook<Values, Err>;
  useField: UseFieldHook<Values, Err>;
};

export const createFormHooks = <Values extends object, Err>(
  Schema: FormSchema<Values, Err>
): FormHooks<Values, Err> => {
  type CtxType = InternalFormtsContext<Values, Err> | undefined;
  const Context = React.createContext<CtxType>(undefined);

  return {
    useFormProvider: useFormProviderHookFactory({ Schema, Context }),
    useFormHandle: useFormHandleHookFactory({ Schema, Context }),
    useFormValues: useFormValuesHookFactory({ Schema, Context }),
    useField: useFieldHookFactory({ Schema, Context }),
  };
};
