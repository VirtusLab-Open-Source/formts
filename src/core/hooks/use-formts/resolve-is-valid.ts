import { entries } from "../../../utils";
import {
  FieldDescriptor,
  isPrimitiveDescriptor,
} from "../../types/field-descriptor";
import { FieldErrors } from "../../types/formts-state";
import { impl } from "../../types/type-mapper-util";

export const resolveIsValid = <Err>(
  errors: FieldErrors<Err>,
  field: FieldDescriptor<unknown>
): boolean => {
  const path = impl(field).__path;

  if (errors[path] != null) {
    return false;
  }

  if (isPrimitiveDescriptor(field)) {
    return errors[path] == null;
  }

  return not(
    entries(errors).some(
      ([errorPath, error]) => error != null && errorPath.startsWith(path)
    )
  );
};

const not = (bool: boolean) => !bool;
