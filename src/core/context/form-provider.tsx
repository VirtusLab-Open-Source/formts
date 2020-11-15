import React from "react";

import { FormControl } from "../types/form-control";
import { InternalFormtsContext } from "../types/formts-context";
import { impl } from "../types/type-mapper-util";

const Context = React.createContext<
  InternalFormtsContext<any, any> | undefined
>(undefined);

type FormProviderProps = {
  control: FormControl;
};

/**
 * Enables usage of formts hooks in nested components
 */
export const FormProvider: React.FC<FormProviderProps> = ({
  control,
  children,
}) => (
  <Context.Provider value={impl(control).__ctx}>{children}</Context.Provider>
);

// internal use only
export const useFormtsContext = <Values extends object, Err>(
  control: FormControl | undefined
): InternalFormtsContext<Values, Err> => {
  const ctx = React.useContext(Context);
  if (ctx != null) return ctx;

  if (!control) {
    throw new Error("FormController not found!");
  }

  return impl<Values, Err>(control).__ctx;
};
