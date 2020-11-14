import React from "react";

import { Nominal } from "../../utils";

import { InternalFormtsContext } from "./formts-context";

export interface FormProvider extends Nominal<"FormProvider", React.FC> {}

export type _FormProviderImpl<Values extends object, Err> = React.FC & {
  __ctx: InternalFormtsContext<Values, Err>;
};
