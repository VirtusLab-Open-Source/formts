import { entries } from "../../../utils";
import {
  FieldDescriptor,
  isPrimitiveDescriptor,
} from "../../types/field-descriptor";
import { FieldValidatingState } from "../../types/formts-state";
import { impl } from "../../types/type-mapper-util";

export const resolveIsValidating = (
  validatingState: FieldValidatingState,
  field: FieldDescriptor<unknown>
): boolean => {
  const path = impl(field).__path;

  if (validatingState[path] != null) {
    return true;
  }

  if (isPrimitiveDescriptor(field)) {
    return validatingState[path] != null;
  }

  return entries(validatingState).some(
    ([validatingFieldPath, validations]) =>
      validations != null && validatingFieldPath.startsWith(path)
  );
};
