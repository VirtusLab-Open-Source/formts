import { createFormSchema } from "./create-form-schema";
import { createFormValidator } from "./form-validator";
import { createFormTransformer } from "./form-transformer";

/**
 * container for form builder functions
 */
export const createForm = {
  schema: createFormSchema,
  validator: createFormValidator,
  transformer: createFormTransformer,
};
