import React from "react";

import { FormtsOptions } from "../hooks/use-form-provider";

import { FormSchema } from "./form-schema";
import { FormtsState, FormtsAction } from "./formts-state";

// internal context consumed by hooks
export type InternalFormtsContext<Values extends object, Err> = {
  options: FormtsOptions<Values, Err>;
  state: FormtsState<Values, Err>;
  dispatch: React.Dispatch<FormtsAction<Values, Err>>;
};

export type HookFactoryContext<Values extends object, Err> = {
  Schema: FormSchema<Values, Err>;
  Context: React.Context<InternalFormtsContext<Values, Err> | undefined>;
};
