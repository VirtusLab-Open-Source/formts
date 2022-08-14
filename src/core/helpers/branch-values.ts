import { filter as OFilter } from "../../utils";
import { FieldDescriptor } from "../types/field-descriptor";
import { FieldErrors, FieldValidatingState } from "../types/formts-state";
import { impl } from "../types/type-mapper-util";

export const constructBranchErrorsString = <Err>(
  errors: FieldErrors<Err>,
  field: FieldDescriptor<unknown>
): string => {
  const branchErrors = OFilter(errors, ({ key }) =>
    isExactOrChildPath(field)(key)
  );

  return JSON.stringify(branchErrors);
};

export const constructBranchValidatingString = (
  validating: FieldValidatingState,
  field: FieldDescriptor<unknown>
): string => {
  const branchValidating = OFilter(validating, ({ key }) =>
    isExactOrChildPath(field)(key)
  );

  return JSON.stringify(branchValidating);
};

export const isExactOrChildPath = (field: FieldDescriptor<unknown>) => (
  path: string
): boolean => {
  const fieldPath = impl(field).__path;

  if (!path.startsWith(fieldPath)) {
    return false;
  }

  switch (path[fieldPath.length]) {
    case undefined: // same path
    case ".": // object child
    case "[": // array element
      return true;

    default:
      // unrelated field starting with the same path
      return false;
  }
};
