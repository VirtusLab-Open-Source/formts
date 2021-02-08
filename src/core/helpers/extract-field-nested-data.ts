import { keys } from "../../utils";
import { FieldDescriptor } from "../types/field-descriptor";
import { FieldErrors, FieldValidatingState } from "../types/formts-state";
import { impl } from "../types/type-mapper-util";

export const childrenErrorsStateString = <Err>(
  errors: FieldErrors<Err>,
  field: FieldDescriptor<unknown>
): string => {
  const path = impl(field).__path;

  const childrenErrors = keys(errors).filter(
    key => key.startsWith(path) && key !== path
  );

  return JSON.stringify(childrenErrors);
};

export const childrenValidatingStateString = (
  validating: FieldValidatingState,
  field: FieldDescriptor<unknown>
): string => {
  const path = impl(field).__path;

  const childrenValidating = keys(validating).filter(
    key => key.startsWith(path) && key !== path
  );

  return JSON.stringify(childrenValidating);
};
