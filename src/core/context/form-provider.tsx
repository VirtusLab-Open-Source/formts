import React from "react";

import { FormController } from "../types/form-controller";
import { InternalFormtsContext } from "../types/formts-context";
import { impl } from "../types/type-mapper-util";

const Context = React.createContext<
  InternalFormtsContext<any, any> | undefined
>(undefined);

type FormProviderProps = {
  controller: FormController;
};

/**
 * Enables usage of formts hooks in nested components
 */
export const FormProvider: React.FC<FormProviderProps> = ({
  controller,
  children,
}) => (
  <Context.Provider value={impl(controller).__ctx}>{children}</Context.Provider>
);

// internal use only
export const useFormtsContext = <Values extends object, Err>(
  controller: FormController | undefined
): InternalFormtsContext<Values, Err> => {
  const ctx = React.useContext(Context);
  if (ctx != null) return ctx;

  if (!controller) {
    throw new Error("FormController not found!");
  }

  return impl<Values, Err>(controller).__ctx;
};
