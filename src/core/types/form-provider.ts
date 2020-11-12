import React from "react";

import { Nominal } from "../../utils";

import { FormSchema } from "./form-schema";
import { InternalFormtsContext } from "./formts-context";

// @ts-ignore
export interface FormProvider<Values extends object, Err>
  extends Nominal<"FormProvider", React.FC> {}

export type _FormProviderImpl<Values extends object, Err> = React.FC & {
  __ctx: InternalFormtsContext<Values, Err>;
  __schema: FormSchema<Values, Err>;
};
