import { filter as OFilter } from "../../utils";
import { FieldDescriptor } from "../types/field-descriptor";
import { FieldErrors, FieldValidatingState } from "../types/formts-state";

import { FieldMatcher } from "./field-matcher";

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
  const fieldMatcher = new FieldMatcher(field);
  return fieldMatcher.matches(path) || fieldMatcher.isParentOf(path);
};
