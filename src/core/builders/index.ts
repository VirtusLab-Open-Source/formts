import { createFormSchema } from "./create-form-schema";
import { createFormValidator } from "./create-form-validator";

/**
 * container for form builder functions
 */
export const createForm = {
  schema: createFormSchema,
  validator: createFormValidator,
  //   transformer: createFormTransformer, // TODO
};
