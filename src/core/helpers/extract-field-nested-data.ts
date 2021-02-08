import { keys } from "../../utils";
import { FieldDescriptor } from "../types/field-descriptor";
import { FieldErrors, FieldValidatingState } from "../types/formts-state";
import { impl } from "../types/type-mapper-util";

export const extractFieldErrors = <Err>(
  errors: FieldErrors<Err>,
  field: FieldDescriptor<unknown>
): FieldErrors<Err> => {
  const path = impl(field).__path;

  return keys(errors)
    .filter(key => key.startsWith(path))
    .reduce((acc, key) => {
      acc[key] = errors[key];
      return acc;
    }, {} as FieldErrors<Err>);
};

export const extractFieldValidating = (
  errors: FieldValidatingState,
  field: FieldDescriptor<unknown>
): FieldValidatingState => {
  const path = impl(field).__path;

  return keys(errors)
    .filter(key => key.startsWith(path))
    .reduce((acc, key) => {
      acc[key] = errors[key];
      return acc;
    }, {} as FieldValidatingState);
};
