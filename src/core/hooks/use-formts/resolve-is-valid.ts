import { entries } from "../../../utils";
import { FieldErrors } from "../../types/formts-state";

export const resolveIsValid = <Err>(
  errors: FieldErrors<Err>,
  path: string
): boolean => {
  if (errors[path] != null) {
    return false;
  }

  return not(
    entries(errors).some(
      ([errorPath, error]) => error != null && errorPath.startsWith(path)
    )
  );
};

const not = (bool: boolean) => !bool;
