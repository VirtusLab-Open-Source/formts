import { Nominal } from "../../utils";

import { InternalFormtsContext } from "./formts-context";

/**
 * Used to connect together hooks or FormProvider component with the actual form state
 */
export interface FormController extends Nominal<"FormControl", {}> {}

export type _FormControllerImpl<Values extends object, Err> = {
  __ctx: InternalFormtsContext<Values, Err>;
};
