import React from "react";

import { FormProvider } from "../../types/form-provider";
import {
  HookFactoryContext,
  InternalFormtsContext,
} from "../../types/formts-context";
import { impl } from "../../types/type-mapper-util";

type Input<Values extends object, Err> = HookFactoryContext<Values, Err> & {
  Provider?: FormProvider<Values, Err>;
};

export const useInternalFormtsContext = <Values extends object, Err>({
  Context,
  Schema,
  Provider,
}: Input<Values, Err>): InternalFormtsContext<Values, Err> => {
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
